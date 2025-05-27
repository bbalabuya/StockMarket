import json, asyncio
from datetime import datetime, time
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query
from websockets import connect as ws_connect
from auth import issue_approval_key

router = APIRouter()

REAL_WS_URL = "ws://ops.koreainvestment.com:21000"

def _hoka_to_dict(raw: str) -> dict:
    f = raw.split("^")
    asks = {f"askp{i+1}": f[3+i]  for i in range(10)}
    bids = {f"bidp{i+1}": f[13+i] for i in range(10)}
    return {**asks, **bids}

async def pingpong_sender(ws):
    print("🕒 PINGPONG 전송 태스크 시작")
    while True:
        now = datetime.now().time()
        if now >= time(15, 30):
            ping_msg = json.dumps({
                "header": {
                    "tr_id": "PINGPONG"
                }
            })
            try:
                await ws.send(ping_msg)
                print("📤 PINGPONG 전송")
            except Exception as e:
                print("❌ PINGPONG 전송 실패:", e)
                break
        await asyncio.sleep(60)

async def connect_and_relay_all(client_ws: WebSocket, ticker: str):
    await client_ws.accept()

    try:
        approval_key = issue_approval_key()
        print("🪪 approval_key 발급:", approval_key)
    except Exception as e:
        print("❌ approval_key 발급 실패:", e)
        await client_ws.close()
        return

    subscribe_msgs = [
        {
            "header": {
                "approval_key": approval_key,
                "custtype": "P",
                "tr_type": "1",
                "content-type": "utf-8",
            },
            "body": {
                "input": {"tr_id": "H0STCNT0", "tr_key": ticker}
            },
        },
        {
            "header": {
                "approval_key": approval_key,
                "custtype": "P",
                "tr_type": "1",
                "content-type": "utf-8",
            },
            "body": {
                "input": {"tr_id": "H0STASP0", "tr_key": ticker}
            },
        },
    ]

    try:
        async with ws_connect(REAL_WS_URL, ping_interval=None) as kis_ws:
            for msg in subscribe_msgs:
                await kis_ws.send(json.dumps(msg))
            print("🟢 체결가 + 호가 구독 요청 전송 완료")

            asyncio.create_task(pingpong_sender(kis_ws))

            async for recv_data in kis_ws:
                print(recv_data)
                if isinstance(recv_data, bytes):
                    recv_data = recv_data.decode("utf-8", "ignore")

                if recv_data and recv_data[0] in ("0", "1"):
                    parts = recv_data.split("|")
                    if len(parts) < 4:
                        continue

                    trid, content = parts[1], parts[3]
                    print(f"📨 실시간 수신 - {trid}")

                    if trid == "H0STCNT0":
                        await client_ws.send_json({
                            "tr_id": trid,
                            "code": ticker,
                            "output": content,
                        })

                    elif trid == "H0STASP0":
                        parsed = _hoka_to_dict(content)
                        await client_ws.send_json({
                            "tr_id": trid,
                            "code": ticker,
                            "output": parsed,
                        })
                else:
                    try:
                        json_obj = json.loads(recv_data)
                        header = json_obj.get("header", {})
                        trid = header.get("tr_id", "")

                        if trid in ("H0STCNI0", "H0STCNI9"):
                            aes_key = json_obj["body"]["output"]["key"]
                            aes_iv = json_obj["body"]["output"]["iv"]
                            print(f"🔐 AES key: {aes_key}, iv: {aes_iv}")

                    except json.JSONDecodeError:
                        print("⚠️ JSON 디코드 실패:", recv_data)

    except WebSocketDisconnect:
        print("🔌 클라이언트 WebSocket 연결 종료 (/ws/all)")
        await client_ws.close()

    except Exception as e:
        print("⚠️ kis_ws 오류 발생:", e)
        # 연결 끊김 시 재시도
        await asyncio.sleep(5)
        print("🔁 WebSocket 재연결 시도 중...")
        await connect_and_relay_all(client_ws, ticker=ticker)

@router.websocket("/ws/all")
async def websocket_all_endpoint(websocket: WebSocket, code: str = Query(...)):
    try:
        await connect_and_relay_all(websocket, ticker=code)
    except WebSocketDisconnect:
        print("🔌 클라이언트 WebSocket 연결 종료 (/ws/all)")

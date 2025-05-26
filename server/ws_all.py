# ws_all.py

import json, asyncio
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query
from websockets import connect as ws_connect
from auth import issue_approval_key

router = APIRouter()

REAL_WS_URL = "ws://ops.koreainvestment.com:21000"

def _hoka_to_dict(raw: str) -> dict:
    """H0STASP0 '^'‐delimited 호가 문자열 → dict(askp1~10, bidp1~10)"""
    f = raw.split("^")
    asks = {f"askp{i+1}": f[3+i]  for i in range(10)}   # 매도호가 (3~12)
    bids = {f"bidp{i+1}": f[13+i] for i in range(10)}   # 매수호가 (13~22)
    return {**asks, **bids}

async def connect_and_relay_all(client_ws: WebSocket, ticker: str):
    await client_ws.accept()
    approval_key = issue_approval_key()
    print("🪪 approval_key 발급:", approval_key)

    # 두 구독 메시지 정의
    subscribe_msgs = [
        {
            "header": {
                "approval_key": approval_key,
                "custtype": "P",
                "tr_type": "1",
                "content-type": "utf-8",
            },
            "body": {
                "input": {"tr_id": "H0STCNT0", "tr_key": ticker}  # 체결가
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
                "input": {"tr_id": "H0STASP0", "tr_key": ticker}  # 호가
            },
        },
    ]

    try:
        async with ws_connect(REAL_WS_URL, ping_interval=60) as kis_ws:
            # 체결가 + 호가 구독 요청 순차 전송
            for msg in subscribe_msgs:
                await kis_ws.send(json.dumps(msg))

            print("🟢 체결가 + 호가 구독 요청 전송 완료")

            async for recv_data in kis_ws:
                if isinstance(recv_data, bytes):
                    recv_data = recv_data.decode("utf-8", "ignore")

                if recv_data and recv_data[0] in ("0", "1"):
                    parts = recv_data.split("|")
                    if len(parts) < 4:
                        continue

                    trid, content = parts[1], parts[3]
                    print(f"📨 데이터 수신 - tr_id: {trid}")

                    if trid == "H0STCNT0":
                        await client_ws.send_json({
                            "tr_id": trid,
                            "code": ticker,
                            "output": content,
                        })

                    elif trid == "H0STASP0":
                        await client_ws.send_json({
                            "tr_id": trid,
                            "code": ticker,
                            "output": _hoka_to_dict(content),
                        })

    except Exception as e:
        print("❌ WebSocket 처리 오류:", e)
        await client_ws.close()

@router.websocket("/ws/all")
async def websocket_all_endpoint(websocket: WebSocket, code: str = Query(...)):
    try:
        await connect_and_relay_all(websocket, ticker=code)
    except WebSocketDisconnect:
        print("🔌 클라이언트 WebSocket 연결 종료 (/ws/all)")

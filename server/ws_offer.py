# ws_offer.py

import json, asyncio
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query
from auth import issue_approval_key
from websockets import connect as ws_connect

router = APIRouter()

REAL_WS_URL = "ws://ops.koreainvestment.com:21000"

def _hoka_to_dict(raw: str) -> dict:
    """H0STASP0 '^'‐delimited 호가 문자열 → dict(askp1~10, bidp1~10)"""
    f = raw.split("^")
    asks = {f"askp{i+1}": f[3+i]  for i in range(10)}   # 매도호가 (3~12)
    bids = {f"bidp{i+1}": f[13+i] for i in range(10)}   # 매수호가 (13~22)
    return {**asks, **bids}

async def connect_offer_ws_and_relay(client_ws: WebSocket, ticker: str):
    await client_ws.accept()
    approval_key = issue_approval_key()
    print("🪪 offer_approval_key:", approval_key)

    subscribe_msg = {
        "header": {
            "approval_key": approval_key,
            "custtype": "P",
            "tr_type": "1",
            "content-type": "utf-8",
        },
        "body": {
            "input": {"tr_id": "H0STASP0", "tr_key": ticker}
        },
    }

    try:
        async with ws_connect(REAL_WS_URL, ping_interval=60) as kis_ws:
            await kis_ws.send(json.dumps(subscribe_msg))
            print("🟢 OFFER 체결 요청 전송됨")

            async for recv_data in kis_ws:
                if isinstance(recv_data, bytes):
                    recv_data = recv_data.decode("utf-8", "ignore")

                # 실데이터 패킷만 처리
                if recv_data and recv_data[0] in ("0", "1"):
                    print("📨 데이터 수신 중")  # ✅ 데이터 수신 로그만 출력

                    parts = recv_data.split("|")
                    if len(parts) < 4:
                        continue
                    trid, content = parts[1], parts[3]

                    if trid == "H0STASP0":
                        payload = {
                            "tr_id": trid,
                            "code": ticker,
                            "output": _hoka_to_dict(content),
                        }
                        await client_ws.send_json(payload)

    except Exception as e:
        print("❌ WS 처리 오류:", e)
        await client_ws.close()

@router.websocket("/ws/offer")
async def websocket_offer_endpoint(websocket: WebSocket, code: str = Query(...)):
    try:
        await connect_offer_ws_and_relay(websocket, ticker=code)
    except WebSocketDisconnect:
        print("🔌 클라이언트 WebSocket 연결 종료 (호가)")

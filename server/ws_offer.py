# ws_offer.py

import json
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query
from auth import issue_approval_key
from websockets import connect as ws_connect

router = APIRouter()

# 한국투자증권 WebSocket 서버 주소 (실전투자)
REAL_WS_URL = "ws://ops.koreainvestment.com:21000"

# WebSocket 연결 및 실시간 10호가 데이터 릴레이
async def connect_offer_ws_and_relay(websocket: WebSocket, ticker="005930"):
    await websocket.accept()
    try:
        approval_key = issue_approval_key()
        print(f"🪪 approval_key 받음: {approval_key}")

        msg = {
            "header": {
                "approval_key": approval_key,
                "custtype": "P",
                "tr_type": "1",
                "content-type": "utf-8"
            },
            "body": {
                "input": {
                    "tr_id": "H0STASP0",  # ✅ 실시간 10호가 TR 코드
                    "tr_key": ticker
                }
            }
        }

        async with ws_connect(REAL_WS_URL, ping_interval=None) as ws:
            await ws.send(json.dumps(msg))
            print("🟢 외부 WebSocket으로 10호가 요청 전송:")
            print(json.dumps(msg, indent=2))

            while True:
                recv_data = await ws.recv()
                print("📨 [WS] OFFER 수신 데이터:")
                try:
                    parsed = json.loads(recv_data)
                    print(json.dumps(parsed, indent=2))
                except Exception:
                    print(recv_data)

                # 클라이언트로 데이터 전송
                await websocket.send_text(recv_data)

    except Exception as e:
        print(f"❌ 10호가 WebSocket 처리 중 오류: {e}")
        await websocket.close()

# ✅ FastAPI용 WebSocket 엔드포인트 (React 연결)
@router.websocket("/ws/offer")
async def websocket_offer_endpoint(websocket: WebSocket, code: str = Query(...)):
    try:
        await connect_offer_ws_and_relay(websocket, ticker=code)
    except WebSocketDisconnect:
        print("🔌 클라이언트 WebSocket 연결 종료 (10호가)")

# websocket.py

import json
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query
from auth import issue_approval_key
from websockets import connect as ws_connect

router = APIRouter()

# WebSocket 연결 및 데이터 릴레이
async def connect_stock_ws_and_relay(websocket: WebSocket, ticker="005930"):
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
                    "tr_id": "H0STCNT0",
                    "tr_key": ticker
                }
            }
        }

        REAL_WS_URL = "ws://ops.koreainvestment.com:21000"
        async with ws_connect(REAL_WS_URL, ping_interval=None) as ws:
            await ws.send(json.dumps(msg))
            print("🟢 외부 WebSocket으로 체결 요청 전송:")
            print(json.dumps(msg, indent=2))

            while True:
                recv_data = await ws.recv()
                print("📨 [WS] 수신 데이터:")
                try:
                    parsed = json.loads(recv_data)
                    print(json.dumps(parsed, indent=2))
                except Exception:
                    print(recv_data)

                await websocket.send_text(recv_data)

    except Exception as e:
        print(f"❌ WebSocket 처리 중 오류: {e}")
        await websocket.close()

# ✅ FastAPI용 WebSocket 라우팅
@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket, code: str = Query(...)):
    try:
        await connect_stock_ws_and_relay(websocket, ticker=code)
    except WebSocketDisconnect:
        print("🔌 클라이언트 WebSocket 연결 종료")

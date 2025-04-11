import asyncio
import websockets
import json
from utils.token_manager import ensure_approval_key

WS_URL = "ws://ops.koreainvestment.com:21000"

async def start_websocket():
    while True:
        try:
            print("📡 WebSocket 연결 시도")
            approval_key = ensure_approval_key()
            subscribe_data = {
                "header": {
                    "approval_key": approval_key,
                    "custtype": "P",
                    "tr_type": "1",
                    "content-type": "utf-8"
                },
                "body": {
                    "input": {
                        "tr_id": "H0STCNT0",
                        "tr_key": "005930"
                    }
                }
            }
            async with websockets.connect(WS_URL, ping_interval=None) as ws:
                await ws.send(json.dumps(subscribe_data))
                print("✅ 구독 요청 전송됨")
                while True:
                    message = await ws.recv()
                    print("💬 수신 체결 데이터:", message)
        except Exception as e:
            print("❌ WebSocket 오류 발생:", e)
            await asyncio.sleep(5)

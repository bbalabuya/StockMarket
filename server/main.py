from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from ws_handler import websocket_endpoint, connect_stock_ws_and_relay
from rest_api import router as rest_api_router

app = FastAPI()

# CORS 설정 (예: http://localhost:3000에서 접근 허용)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# REST API 라우터 등록
app.include_router(rest_api_router)

# WebSocket 엔드포인트 등록
app.websocket("/ws")(websocket_endpoint)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)

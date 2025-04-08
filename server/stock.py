import os
import time
import json
import asyncio
import requests
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from websockets import connect as ws_connect
from dotenv import load_dotenv, set_key

load_dotenv()

app = FastAPI()

APP_KEY = os.getenv("APP_KEY")
APP_SECRET = os.getenv("APP_SECRET")
ACCESS_TOKEN = os.getenv("ACCESS_TOKEN")
TOKEN_TIMESTAMP = float(os.getenv("TOKEN_TIMESTAMP", "0"))

REAL_WS_URL = "ws://ops.koreainvestment.com:21000"

def token_expired():
    return time.time() - TOKEN_TIMESTAMP > 86400

def save_token_to_env(token, timestamp):
    set_key(".env", "ACCESS_TOKEN", token)
    set_key(".env", "TOKEN_TIMESTAMP", str(timestamp))

def issue_access_token():
    global ACCESS_TOKEN, TOKEN_TIMESTAMP
    print("🔄 access_token 발급 중...")

    url = "https://openapi.koreainvestment.com:9443/oauth2/tokenP"
    headers = {"content-type": "application/json"}
    data = {
        "grant_type": "client_credentials",
        "appkey": APP_KEY,
        "appsecret": APP_SECRET
    }

    response = requests.post(url, headers=headers, json=data)
    if response.status_code == 200:
        res_json = response.json()
        ACCESS_TOKEN = res_json["access_token"]
        TOKEN_TIMESTAMP = time.time()
        save_token_to_env(ACCESS_TOKEN, TOKEN_TIMESTAMP)
        print("✅ access_token 발급 완료")
    else:
        raise Exception(f"access_token 발급 실패: {response.text}")

def issue_approval_key():
    print("🔑 approval_key 발급 중...")
    url = "https://openapi.koreainvestment.com:9443/oauth2/Approval"
    headers = {"Content-Type": "application/json"}
    data = {
        "grant_type": "client_credentials",
        "appkey": APP_KEY,
        "secretkey": APP_SECRET
    }

    response = requests.post(url, headers=headers, json=data)
    if response.status_code == 200:
        approval_key = response.json().get("approval_key")
        if not approval_key:
            raise Exception("approval_key 응답에 없음")
        print("✅ approval_key 발급 완료")
        return approval_key
    else:
        raise Exception(f"approval_key 발급 실패: {response.text}")

def ensure_token_and_approval_key():
    if not ACCESS_TOKEN or token_expired():
        issue_access_token()
    return issue_approval_key()

async def connect_stock_ws_and_relay(websocket: WebSocket, ticker="005930"):
    await websocket.accept()
    print("✅ 클라이언트 WebSocket 연결 수락됨")

    try:
        approval_key = ensure_token_and_approval_key()
        print(f"🪪 받은 approval_key: {approval_key}")

        msg = {
            "header": {
                "approval_key": approval_key,
                "custtype": "P",
                "tr_type": "1",
                "content-type": "utf-8"
            },
            "body": {
                "input":{
                "tr_id": "H0STCNT0",
                "tr_key": ticker
                }
            }
        }

        print(f"📦 WebSocket 체결가 요청 전송: {json.dumps(msg, indent=2)}")
        async with ws_connect(REAL_WS_URL, ping_interval=None) as ws:
            await ws.send(json.dumps(msg))
            print("🟢 체결가 수신 대기 중...")

            while True:
                recv_data = await ws.recv()
                print(f"📨 수신 데이터: {recv_data}")  # << 여기에 출력 추가
                await websocket.send_text(recv_data)

    except Exception as e:
        print(f"❌ WebSocket 처리 중 오류: {e}")
        await websocket.close()


@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    try:
        await connect_stock_ws_and_relay(websocket)
    except WebSocketDisconnect:
        print("🔌 클라이언트 WebSocket 연결 종료")
        print("Good!")

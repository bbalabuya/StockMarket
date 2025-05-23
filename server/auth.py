# auth.py
import os, time, requests
from dotenv import load_dotenv, set_key

ENV_PATH = ".env"
load_dotenv(dotenv_path=ENV_PATH)

APP_KEY = os.getenv("APP_KEY")
APP_SECRET = os.getenv("APP_SECRET")

def token_expired(token_timestamp_str: str) -> bool:
    try:
        token_timestamp = float(token_timestamp_str)
    except (TypeError, ValueError):
        return True
    return time.time() - token_timestamp > 86400

def get_access_token():
    ACCESS_TOKEN = os.getenv("ACCESS_TOKEN")
    TOKEN_TIMESTAMP = os.getenv("TOKEN_TIMESTAMP")

    if ACCESS_TOKEN and TOKEN_TIMESTAMP and not token_expired(TOKEN_TIMESTAMP):
        print(f"✅ 기존 access_token 사용: {ACCESS_TOKEN}")
        return ACCESS_TOKEN

    url = "https://openapi.koreainvestment.com:9443/oauth2/tokenP"
    headers = {"Content-Type": "application/json"}
    data = {
        "grant_type": "client_credentials",
        "appkey": APP_KEY,
        "appsecret": APP_SECRET
    }
    response = requests.post(url, headers=headers, json=data)
    if response.status_code == 200:
        res_json = response.json()
        access_token = res_json["access_token"]
        token_timestamp = time.time()
        set_key(ENV_PATH, "ACCESS_TOKEN", access_token)
        set_key(ENV_PATH, "TOKEN_TIMESTAMP", str(token_timestamp))
        print(f"✅ 신규 access_token 발급: {access_token}")
        return access_token
    else:
        raise Exception(f"access_token 발급 실패: {response.text}")

def get_auth_headers() -> dict:
    access_token = get_access_token()
    return {
        "Content-Type": "application/json; charset=utf-8",
        "authorization": f"Bearer {access_token}",
        "appkey": APP_KEY,
        "appsecret": APP_SECRET,
        "tr_id": "FHPST01060000",
        "custtype": "P"
    }

def issue_approval_key():
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
        print(f"✅ approval_key 발급 완료: {approval_key}")
        return approval_key
    else:
        raise Exception(f"approval_key 발급 실패: {response.text}")

def create_ws_subscribe_message(ticker: str) -> dict:
    """외부 WebSocket 서버에 보낼 메시지를 구성"""
    approval_key = issue_approval_key()
    print(f"🪪 approval_key 발급 및 메시지 구성 완료")
    return {
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

import os
import time
import requests
from dotenv import load_dotenv, set_key
from filelock import FileLock

# 환경변수 로딩
load_dotenv()
APP_KEY = os.getenv("APP_KEY")
APP_SECRET = os.getenv("APP_SECRET")
ENV_PATH = ".env"
ACCESS_TOKEN_LOCK = ".access_token.lock"
APPROVAL_KEY_LOCK = ".approval_key.lock"

def getappkey():
    return (APP_KEY, APP_SECRET)

def token_expired(token_timestamp_str: str) -> bool:
    try:
        token_timestamp = float(token_timestamp_str)
    except (TypeError, ValueError):
        return True
    return time.time() - token_timestamp > 86400

def get_access_token():
    """
    ACCESS_TOKEN이 존재하고 유효하면 그대로 반환하고,
    없거나 만료시에는 새 토큰 발급 후 .env 파일 업데이트
    """
    with FileLock(ACCESS_TOKEN_LOCK):
        ACCESS_TOKEN = os.getenv("ACCESS_TOKEN")
        TOKEN_TIMESTAMP = os.getenv("TOKEN_TIMESTAMP")

        if ACCESS_TOKEN and TOKEN_TIMESTAMP and not token_expired(TOKEN_TIMESTAMP):
            print(f"✅ 기존 access_token을 사용합니다")
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

def issue_approval_key():
    """
    approval_key는 WebSocket 연결 시 매번 새로 발급해야 하므로
    중복 호출 방지를 위해 filelock 적용.
    """
    with FileLock(APPROVAL_KEY_LOCK):
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
            print(f"🆕 approval_key 새로 발급: {approval_key}")
            time.sleep(3)
            return approval_key
        else:
            raise Exception(f"approval_key 발급 실패: {response.text}")

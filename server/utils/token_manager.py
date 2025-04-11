import os
import time
import requests
from dotenv import load_dotenv

load_dotenv()

APP_KEY = os.getenv("APP_KEY")
APP_SECRET = os.getenv("APP_SECRET")
ACCESS_TOKEN = os.getenv("ACCESS_TOKEN")
TOKEN_TIMESTAMP = float(os.getenv("TOKEN_TIMESTAMP", "0"))

ENV_PATH = ".env"


def token_expired():
    return time.time() - TOKEN_TIMESTAMP > 86400


def issue_access_token():
    global ACCESS_TOKEN, TOKEN_TIMESTAMP
    url = "https://openapi.koreainvestment.com:9443/oauth2/tokenP"
    headers = {"content-type": "application/json"}
    data = {
        "grant_type": "client_credentials",
        "appkey": APP_KEY,
        "appsecret": APP_SECRET
    }
    response = requests.post(url, headers=headers, json=data)
    response.raise_for_status()
    res_json = response.json()
    ACCESS_TOKEN = res_json["access_token"]
    TOKEN_TIMESTAMP = time.time()
    update_env(ACCESS_TOKEN, TOKEN_TIMESTAMP)


def issue_approval_key():
    url = "https://openapi.koreainvestment.com:9443/oauth2/Approval"
    headers = {"Content-Type": "application/json"}
    data = {
        "grant_type": "client_credentials",
        "appkey": APP_KEY,
        "secretkey": APP_SECRET
    }
    response = requests.post(url, headers=headers, json=data)
    response.raise_for_status()
    return response.json().get("approval_key")


def ensure_token():
    if not ACCESS_TOKEN or token_expired():
        issue_access_token()
    return ACCESS_TOKEN


def ensure_approval_key():
    ensure_token()
    return issue_approval_key()


def update_env(access_token, token_timestamp):
    with open(ENV_PATH, "r") as f:
        lines = f.readlines()

    new_lines = []
    found_token, found_time = False, False
    for line in lines:
        if line.startswith("ACCESS_TOKEN="):
            new_lines.append(f"ACCESS_TOKEN={access_token}\n")
            found_token = True
        elif line.startswith("TOKEN_TIMESTAMP="):
            new_lines.append(f"TOKEN_TIMESTAMP={token_timestamp}\n")
            found_time = True
        else:
            new_lines.append(line)

    if not found_token:
        new_lines.append(f"ACCESS_TOKEN={access_token}\n")
    if not found_time:
        new_lines.append(f"TOKEN_TIMESTAMP={token_timestamp}\n")

    with open(ENV_PATH, "w") as f:
        f.writelines(new_lines)
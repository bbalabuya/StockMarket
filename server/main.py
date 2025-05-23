import os
import json
import time
import requests
from datetime import datetime
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Query
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv, set_key

# 환경변수 로딩 (APP_KEY, APP_SECRET, ACCESS_TOKEN, TOKEN_TIMESTAMP)
load_dotenv()
APP_KEY = os.getenv("APP_KEY")
APP_SECRET = os.getenv("APP_SECRET")
ENV_PATH = ".env"

app = FastAPI()

# CORS 설정 (예: http://localhost:3000에서 접근 허용)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --------------------------------------------------
# [토큰 관리 관련 함수]
# --------------------------------------------------
def token_expired(token_timestamp_str: str) -> bool:
    """
    환경변수에 저장된 토큰 발급시간을 기준으로 토큰 만료 여부 판단 (24시간 기준)
    """
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
    ACCESS_TOKEN = os.getenv("ACCESS_TOKEN")
    TOKEN_TIMESTAMP = os.getenv("TOKEN_TIMESTAMP")
    
    if ACCESS_TOKEN and TOKEN_TIMESTAMP and not token_expired(TOKEN_TIMESTAMP):
        print(f"✅ 기존 access_token을 사용합니다다")
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
        # .env 파일 업데이트: set_key를 이용하여 저장
        set_key(ENV_PATH, "ACCESS_TOKEN", access_token)
        set_key(ENV_PATH, "TOKEN_TIMESTAMP", str(token_timestamp))
        print(f"✅ 신규 access_token 발급: {access_token}")
        return access_token
    else:
        raise Exception(f"access_token 발급 실패: {response.text}")

def issue_approval_key():
    """
    Koreainvestment API의 approval_key를 발급받는 함수
    """
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

# --------------------------------------------------
# [WebSocket 엔드포인트 및 처리 함수]
# --------------------------------------------------
# ✅ 수정된 함수
async def connect_stock_ws_and_relay(websocket: WebSocket, ticker: str):
    await websocket.accept()
    print(f"✅ 클라이언트 WebSocket 연결 수락됨 - ticker: {ticker}")
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
        from websockets import connect as ws_connect

        async with ws_connect(REAL_WS_URL, ping_interval=None) as ws:
            await ws.send(json.dumps(msg))
            print("🟢 외부 WebSocket으로 체결 요청 전송:")
            print(json.dumps(msg, indent=2))

            while True:
                recv_data = await ws.recv()
                try:
                    parsed = json.loads(recv_data)
                    print("📨 수신 데이터(json):", json.dumps(parsed, indent=2))
                except:
                    print("📨 수신 데이터(raw):", recv_data)
                await websocket.send_text(recv_data)

    except Exception as e:
        print(f"❌ WebSocket 처리 중 오류: {e}")
        await websocket.close()

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """
    클라이언트의 WebSocket 요청에서 종목 코드(`code`)를 추출해 실시간 체결가 전달
    """
    try:
        query_params = dict(websocket.query_params)
        ticker = query_params.get("code", "005930")  # 기본은 삼성전자
        await connect_stock_ws_and_relay(websocket, ticker)
    except WebSocketDisconnect:
        print("🔌 클라이언트 WebSocket 연결 종료")

# --------------------------------------------------
# [REST API 엔드포인트: 체결 데이터 조회]
# --------------------------------------------------
@app.get("/stock/time-conclusion")
def get_multiple_stock_conclusions(iscd: str = Query(...)):
    """
    09:00부터 현재 시각(단, 15:30까지, 마감시간 이후는 15:30 데이터만 사용)
    까지 체결 데이터를 조회하여 반환합니s다.
    
    - iscd: 조회할 종목 코드 (예: 005930)
    """
    access_token = get_access_token()
    
    url = "https://openapi.koreainvestment.com:9443/uapi/domestic-stock/v1/quotations/inquire-time-itemconclusion"
    headers = {
         "Content-Type": "application/json; charset=utf-8",
         "authorization": f"Bearer {access_token}",
         "appkey": APP_KEY,
         "appsecret": APP_SECRET,
         "tr_id": "FHPST01060000",
         "custtype": "P"
    }
    now = datetime.now()
    hour = now.hour
    minute = now.minute
    rounded_minute = (minute // 15) * 15

    # 15:30(15시 30분) 이후의 경우 데이터는 15시까지만 사용
    const_max_hour = 15  # 오후 3시
    const_max_min = 30   # 30분

    times = []
    # 09:00부터 현재 시간 또는 마감시간(15:30)까지 15분 간격 시간대 생성 (예: "090000", "091500", ...)
    for h in range(9, min(hour, const_max_hour) + 1):
         for m in [0, 15, 30, 45]:
             if h == const_max_hour and m > const_max_min:
                 break
             if h == hour and hour < const_max_hour and m > rounded_minute:
                 break
             t = f"{h:02d}{m:02d}00"
             times.append(t)
    
    # data_map에 각 시간대별로 데이터를 저장 (시간을 키로 사용)
    data_map = {}
    # 로그를 위한 리스트
    log_list = []
    for t in times:
         params = {
             "fid_cond_mrkt_div_code": "J",
             "fid_input_iscd": iscd,
             "fid_input_hour_1": t
         }
         try:
              response = requests.get(url, headers=headers, params=params)
              response.raise_for_status()
              res_data = response.json()
              
              output2 = res_data.get("output2", [])
              if output2:
                 last_item = output2[-1]
                 price = int(last_item["stck_prpr"].replace(",", "")) if last_item.get("stck_prpr") else None
                 prdy_vrss = int(last_item["prdy_vrss"].replace(",", "")) if last_item.get("prdy_vrss") else None
                 prdy_sign = last_item.get("prdy_vrss_sign", "")
                 prdy_ctrt = float(last_item["prdy_ctrt"]) if last_item.get("prdy_ctrt") else None
                 
                 volume_str = last_item.get("acml_vol", "")
                 volume = int(volume_str.replace(",", "")) if volume_str else None

                 # 각 시간대별 요약 로그 문자열 생성 (예: "09:00 - prdy_ctrt: 0, prdy_sign: 3, prdy_vrss: 0, price: 56600, volume: 1")
                 log_str = (
                     f"{t[:2]}:{t[2:4]} - "
                     f"prdy_ctrt: {prdy_ctrt}, "
                     f"prdy_sign: {prdy_sign}, "
                     f"prdy_vrss: {prdy_vrss}, "
                     f"price: {price}, "
                     f"volume: {volume}"
                 )
                 log_list.append(log_str)

                 # data_map에 저장 (시간을 키로 사용)
                 data_map[t] = {
                     "price": price,
                     "prdy_vrss": prdy_vrss,
                     "prdy_sign": prdy_sign,
                     "prdy_ctrt": prdy_ctrt,
                     "volume": volume
                 }
         except requests.exceptions.RequestException as e:
              print(f"❌ 요청 실패 ({t}): {e}")
              continue

    # 모든 시간대의 로그를 한 번에 출력
    ##if log_list:
      ##   print("[REST] 최종 데이터 요약:")
        ## print("\n".join(log_list))

    # data_map의 키를 기준으로 정렬하여 리스트로 변환
     # data_map의 키를 기준으로 정렬하여 리스트로 변환
    sorted_data = []
    for key in sorted(data_map.keys()):
        sorted_data.append({
            "time": key,
            "price": data_map[key]["price"],
            "prdy_vrss": data_map[key]["prdy_vrss"],
            "prdy_sign": data_map[key]["prdy_sign"],
            "prdy_ctrt": data_map[key]["prdy_ctrt"],
            "volume": data_map[key]["volume"]
        })

    return {
        "ticker": iscd,
        "data": sorted_data,
        "timestamp": datetime.now().isoformat()
    }

def format_large_number(num: float) -> str:
    """사람이 읽기 쉬운 형태로 10진수 기준 단위 조, 억, 만, 천 단위로 포맷"""
    num = int(num)
    units = [("조", 10**12), ("억", 10**8), ("만", 10**4), ("", 1)]
    result = ""
    for name, value in units:
        unit_amount = num // value
        if unit_amount > 0:
            result += f"{unit_amount:,}{name} "
            num %= value
    return result.strip()


@app.get("/stock/info")
def get_stock_info(iscd: str = "005930"):
    access_token = get_access_token()
    url = "https://openapi.koreainvestment.com:9443/uapi/domestic-stock/v1/quotations/inquire-price"
    headers = {
        "Content-Type": "application/json",
        "authorization": f"Bearer {access_token}",
        "appkey": APP_KEY,
        "appsecret": APP_SECRET,
        "tr_id": "FHKST01010100"  # 주식 현재가 조회
    }
    params = {
        "FID_COND_MRKT_DIV_CODE": "J",  # 코스피
        "FID_INPUT_ISCD": iscd
    }

    response = requests.get(url, headers=headers, params=params)

    if response.status_code != 200:
        raise HTTPException(status_code=500, detail="주식 정보를 불러오지 못했습니다.")

    data = response.json().get("output", {})

    try:
        market_cap_raw = float(data["hts_avls"]) * 100000000  # 백만원 → 원
        shares_outstanding_raw = float(data["lstn_stcn"])     # 그대로 주 수

        result = {
            "현재가": f"{int(data['stck_prpr']):,}원",
            "PER": data.get("per", "-"),
            "PBR": data.get("pbr", "-"),
            "시가총액": format_large_number(market_cap_raw),
            "유통주식수": format_large_number(shares_outstanding_raw) + " 주"
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"데이터 파싱 오류: {e}")

    return result


@app.get("/getKoreaIndex")
def get_korea_index():
    access_token = get_access_token()
    url = "https://openapi.koreainvestment.com:9443/uapi/domestic-stock/v1/quotations/inquire-index-price"

    headers = {
        "Content-Type": "application/json",
        "authorization": f"Bearer {access_token}",
        "appkey": APP_KEY,
        "appsecret": APP_SECRET,
        "tr_id": "FHPUP02100000"
    }

    params = {
        "FID_COND_MRKT_DIV_CODE": "J",   # 코스피 시장
        "FID_INPUT_ISCD": "0001"         # 코스피 지수 코드
    }

    response = requests.get(url, headers=headers, params=params)
    data = response.json()
    print(data)
    output = data.get("output")

    if output:
        result = {
            "현재지수": output["bstp_nmix_prpr"],
            "전일대비": output["bstp_nmix_prdy_vrss"],
            "등락률": output["bstp_nmix_prdy_ctrt"],
            "거래량": output["acml_vol"],
            "거래대금": output["acml_tr_pbmn"]
        }
        return result


# --------------------------------------------------
# 애플리케이션 실행
# --------------------------------------------------
if __name__ == "__main__":
    import uvicorn
    # 파일명이 main.py라면 "main:app"으로 실행 (실제 파일명에 맞게 수정)
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)

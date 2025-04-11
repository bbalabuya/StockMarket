import requests
from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime
from utils.token_manager import ensure_token
import os

APP_KEY = os.getenv("APP_KEY")
APP_SECRET = os.getenv("APP_SECRET")

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/stock/time-conclusion")
def get_multiple_stock_conclusions(iscd: str = Query(...)):
    ACCESS_TOKEN = ensure_token()
    url = "https://openapi.koreainvestment.com:9443/uapi/domestic-stock/v1/quotations/inquire-time-itemconclusion"
    headers = {
        "Content-Type": "application/json; charset=utf-8",
        "authorization": f"Bearer {ACCESS_TOKEN}",
        "appkey": APP_KEY,
        "appsecret": APP_SECRET,
        "tr_id": "FHPST01060000",
        "custtype": "P"
    }

    now = datetime.now()
    hour = now.hour
    minute = now.minute
    rounded_minute = (minute // 15) * 15

    const_max_hour = 15
    const_max_min = 30

    times = []
    for h in range(9, min(hour, const_max_hour) + 1):
        for m in [0, 15, 30, 45]:
            if h == const_max_hour and m > const_max_min:
                break
            if h == hour and hour < const_max_hour and m > rounded_minute:
                break
            t = f"{h:02d}{m:02d}00"
            times.append(t)

    data_list = []
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

                data_list.append({
                    "time": t,
                    "price": price,
                    "prdy_vrss": prdy_vrss,
                    "prdy_sign": prdy_sign,
                    "prdy_ctrt": prdy_ctrt,
                    "volume": volume
                })
        except requests.exceptions.RequestException:
            continue

    return {"data": data_list}
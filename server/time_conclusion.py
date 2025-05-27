# time_conclusion.py

import requests
from datetime import datetime
from fastapi import APIRouter, Query
from auth import get_access_token, getappkey

router = APIRouter()

APP_KEY, APP_SECRET = getappkey()

@router.get("/stock/time-conclusion")
def get_multiple_stock_conclusions(iscd: str = Query(...)):
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
    hour, minute = now.hour, now.minute
    rounded_minute = (minute // 15) * 15
    const_max_hour, const_max_min = 15, 30

    times = []
    for h in range(9, min(hour, const_max_hour) + 1):
         for m in [0, 15, 30, 45]:
             if h == const_max_hour and m > const_max_min: break
             if h == hour < const_max_hour and m > rounded_minute: break
             times.append(f"{h:02d}{m:02d}00")

    data_map = {}
    for t in times:
         params = {
             "fid_cond_mrkt_div_code": "J",
             "fid_input_iscd": iscd,
             "fid_input_hour_1": t
         }
         try:
              resp = requests.get(url, headers=headers, params=params)
              resp.raise_for_status()
              out2 = resp.json().get("output2", [])
              if out2:
                  last = out2[-1]
                  price = int(last["stck_prpr"].replace(",", "")) if last.get("stck_prpr") else None
                  prdy_vrss = int(last["prdy_vrss"].replace(",", "")) if last.get("prdy_vrss") else None
                  prdy_sign = last.get("prdy_vrss_sign", "")
                  prdy_ctrt = float(last["prdy_ctrt"]) if last.get("prdy_ctrt") else None
                  vol = int(last.get("acml_vol","0").replace(",", ""))
                  data_map[t] = {
                      "price": price,
                      "prdy_vrss": prdy_vrss,
                      "prdy_sign": prdy_sign,
                      "prdy_ctrt": prdy_ctrt,
                      "volume": vol
                  }
         except Exception as e:
              print(f"❌ 요청 실패 ({t}): {e}")
              continue

    sorted_data = [
        {"time": k, **v}
        for k, v in sorted(data_map.items())
    ]
    #----------------------------------------------
    # 데이터가 없으면 샘플 데이터 반환하도록 임시설계
    #----------------------------------------------
    if not sorted_data:
        sorted_data = sampleChartData

    return {
        "ticker": iscd,
        "data": sorted_data,
        "timestamp": datetime.now().isoformat()
    }

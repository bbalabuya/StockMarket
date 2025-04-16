import os, json, time, requests
from datetime import datetime
from fastapi import APIRouter, Query
from auth import get_access_token

router = APIRouter()

@router.get("/stock/time-conclusion")
def get_multiple_stock_conclusions(iscd: str = Query(...)):
    access_token = get_access_token()
    url = "https://openapi.koreainvestment.com:9443/uapi/domestic-stock/v1/quotations/inquire-time-itemconclusion"
    headers = {
        "Content-Type": "application/json; charset=utf-8",
        "authorization": f"Bearer {access_token}",
        "appkey": os.getenv("APP_KEY"),
        "appsecret": os.getenv("APP_SECRET"),
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
    data_map = {}
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
                log_str = (
                    f"{t[:2]}:{t[2:4]} - "
                    f"prdy_ctrt: {prdy_ctrt}, "
                    f"prdy_sign: {prdy_sign}, "
                    f"prdy_vrss: {prdy_vrss}, "
                    f"price: {price}, "
                    f"volume: {volume}"
                )
                log_list.append(log_str)
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
    if log_list:
        print("[REST] 최종 데이터 요약:")
        print("\n".join(log_list))
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
    return {"data": sorted_data}

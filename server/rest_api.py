import os, json, time, requests
from datetime import datetime
from fastapi import APIRouter, Query
from auth import get_access_token, token_expired

router = APIRouter()

@router.get("/stock/time-conclusion")
def get_multiple_stock_conclusions(iscd: str = Query(...)):
    # 1) 환경변수에서 토큰과 타임스탬프 읽기
    access_token = os.getenv("ACCESS_TOKEN")
    token_ts = os.getenv("TOKEN_TIMESTAMP")

    # 2) 토큰 유효기간 확인 (24시간 초과 시 재발급)
    if not access_token or not token_ts or token_expired(token_ts):
        access_token = get_access_token()

    # 3) API 호출을 위한 헤더 세팅
    url = (
        "https://openapi.koreainvestment.com:9443/uapi/domestic-stock/v1/quotations/"
        "inquire-time-itemconclusion"
    )
    headers = {
        "Content-Type": "application/json; charset=utf-8",
        "authorization": f"Bearer {access_token}",
        "appkey": os.getenv("APP_KEY"),
        "appsecret": os.getenv("APP_SECRET"),
        "tr_id": "FHPST01060000",
        "custtype": "P"
    }

    # 4) 15분 단위 시간대 리스트 생성
    now = datetime.now()
    hour, minute = now.hour, now.minute
    rounded_minute = (minute // 15) * 15
    const_max_hour, const_max_min = 15, 30
    times = []
    for h in range(9, min(hour, const_max_hour) + 1):
        for m in (0, 15, 30, 45):
            if h == const_max_hour and m > const_max_min:
                break
            if h == hour and hour < const_max_hour and m > rounded_minute:
                break
            times.append(f"{h:02d}{m:02d}00")

    data_map, log_list = {}, []
    # 5) 각 시간대별 REST 조회
    for t in times:
        params = {
            "fid_cond_mrkt_div_code": "J",
            "fid_input_iscd": iscd,
            "fid_input_hour_1": t
        }
        try:
            resp = requests.get(url, headers=headers, params=params)
            resp.raise_for_status()
            output2 = resp.json().get("output2", [])
            if output2:
                last = output2[-1]
                price = int(last.get("stck_prpr", "0").replace(",", ""))
                vrss = int(last.get("prdy_vrss", "0").replace(",", ""))
                sign = last.get("prdy_vrss_sign", "")
                ctrt = float(last.get("prdy_ctrt", 0))
                vol = int(last.get("acml_vol", "0").replace(",", ""))
                log_list.append(
                    f"{t[:2]}:{t[2:4]} - price: {price}, prdy_vrss: {vrss}, prdy_sign: {sign}, prdy_ctrt: {ctrt}, volume: {vol}"
                )
                data_map[t] = {"price": price, "prdy_vrss": vrss, "prdy_sign": sign, "prdy_ctrt": ctrt, "volume": vol}
        except requests.RequestException as e:
            print(f"❌ 요청 실패 ({t}): {e}")
            continue

    # 6) 로그와 응답 정렬
    if log_list:
        print("[REST] 최종 데이터 요약:")
        print("\n".join(log_list))

    sorted_data = [
        {"time": k, **data_map[k]}
        for k in sorted(data_map)
    ]
    return {"data": sorted_data}

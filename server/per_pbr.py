# per_pbr.py
from fastapi import APIRouter, HTTPException, Query
import requests
from auth import get_access_token, getappkey

router = APIRouter()

# 함수 호출로 값 할당
APP_KEY, APP_SECRET = getappkey()

def format_large_number(num: float) -> str:
    num = int(num)
    units = [("조", 10**12), ("억", 10**8), ("만", 10**4), ("", 1)]
    result = ""
    for name, value in units:
        cnt = num // value
        if cnt:
            result += f"{cnt:,}{name} "
            num %= value
    return result.strip()

@router.get("/stock/info")
def get_stock_info(iscd: str = Query(...)):
    access_token = get_access_token()
    url = "https://openapi.koreainvestment.com:9443/uapi/domestic-stock/v1/quotations/inquire-price"
    headers = {
        "Content-Type": "application/json",
        "authorization": f"Bearer {access_token}",
        "appkey": APP_KEY,
        "appsecret": APP_SECRET,
        "tr_id": "FHKST01010100"
    }
    params = {
        "FID_COND_MRKT_DIV_CODE": "J",
        "FID_INPUT_ISCD": iscd
    }

    response = requests.get(url, headers=headers, params=params)

    if response.status_code != 200:
        raise HTTPException(status_code=500, detail="주식 정보를 불러오지 못했습니다.")

    data = response.json().get("output", {})

    try:
        market_cap_raw = float(data["hts_avls"]) * 100000000
        shares_outstanding_raw = float(data["lstn_stcn"])

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

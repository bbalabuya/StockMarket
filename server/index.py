# index.py

from fastapi import APIRouter, HTTPException
import requests  # ✅ 누락되어 있던 import
from auth import get_access_token, getappkey

APP_KEY, APP_SECRET = getappkey()

router = APIRouter()

@router.get("/getKoreaIndex")
def get_korea_index():
    access_token = get_access_token()
    url = "https://openapi.koreainvestment.com:9443/uapi/domestic-stock/v1/quotations/inquire-index-category-price"

    headers = {
        "Content-Type": "application/json",
        "authorization": f"Bearer {access_token}",
        "appkey": APP_KEY,
        "appsecret": APP_SECRET,
        "tr_id": "FHPUP02140000"
    }

    indices = [
        {"name": "코스피", "code": "0001", "market": "K"},
        {"name": "코스닥", "code": "1001", "market": "Q"},
        {"name": "코스피200", "code": "2001", "market": "K2"}
    ]

    results = {}

    for index in indices:
        params = {
            "FID_COND_MRKT_DIV_CODE": "U",  # 고정값
            "FID_INPUT_ISCD": index["code"],
            "FID_MRKT_CLS_CODE": index["market"],
            "FID_BLNG_CLS_CODE": "0"
        }

        response = requests.get(url, headers=headers, params=params)
        print(f"{index['name']} 응답 코드:", response.status_code)

        if response.status_code != 200:
            raise HTTPException(status_code=500, detail=f"{index['name']} 정보를 불러오지 못했습니다.")

        data = response.json().get("output1", {})
        print(f"{index['name']} 응답 데이터:", data)

        try:
            results[index["name"]] = {
                "현재지수": data.get("bstp_nmix_prpr", "-"),
                "전일대비": data.get("bstp_nmix_prdy_vrss", "-"),
                "등락률": f"{data.get('bstp_nmix_prdy_ctrt', '-')}%",
                "거래량": f"{int(float(data.get('acml_vol', 0))):,}주",
                "거래대금": f"{int(float(data.get('acml_tr_pbmn', 0))):,}원",
                "상승종목수": data.get("ascn_issu_cnt", "-"),
                "하락종목수": data.get("down_issu_cnt", "-"),
                "보합종목수": data.get("stnr_issu_cnt", "-")
            }
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"{index['name']} 데이터 파싱 오류: {e}")

    return results

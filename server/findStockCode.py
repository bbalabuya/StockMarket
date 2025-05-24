from fastapi import APIRouter, Query
import FinanceDataReader as fdr
import pandas as pd
from urllib.parse import unquote

router = APIRouter()

@router.get("/search-code")
def search_code(name: str = Query(...)):
    try:
        print("✅ [1] 라우터 작동 시작")
        decoded_name = unquote(name)
        print(f"✅ [2] 디코딩된 종목명: {decoded_name}")

        df_kospi = fdr.StockListing('KOSPI')
        df_kosdaq = fdr.StockListing('KOSDAQ')
        print(f"✅ [3] KOSPI 종목 수: {len(df_kospi)}, KOSDAQ 종목 수: {len(df_kosdaq)}")

        df_all = pd.concat([df_kospi, df_kosdaq], ignore_index=True)
        print(f"✅ [4] 전체 종목 수 (병합 후): {len(df_all)}")

        # 이름 검색
        matched = df_all[df_all['Name'].str.contains(decoded_name, case=False, na=False)]
        print(f"✅ [5] 이름 매칭된 종목 수: {len(matched)}")
        print(f"✅ [6] 매칭 결과:\n{matched[['Code', 'Name']].head()}")

        if not matched.empty:
            results = matched[['Code', 'Name']].to_dict(orient='records')
            print("✅ [7] 최종 반환 결과:", results)
            return {"matches": results}
        else:
            print("⚠️ [8] 매칭되는 종목 없음")
            return {"matches": []}
    except Exception as e:
        print("❌ [오류 발생]:", str(e))
        return {"error": str(e)}

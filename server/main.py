from datetime import datetime
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Query
from fastapi.middleware.cors import CORSMiddleware
from time_conclusion import router as time_router
from per_pbr import router as per_pbr
from index import router as index
from index_naver import router as index_naver
from findStockCode import router as search_code
from websocket import router as websocket_router  # ✅ 추가


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
# [WebSocket 엔드포인트 및 처리 함수]
# --------------------------------------------------
app.include_router(websocket_router)  # ✅ WebSocket 라우터 등록


# --------------------------------------------------
# [REST API 엔드포인트: 체결 데이터 조회]
# --------------------------------------------------
# 시간별 데이터 조회회
app.include_router(time_router)

#----------------------------
#주식정보 PER PBR
app.include_router(per_pbr)

#-------------------------
# 코스피 코스닥 index
app.include_router(index)
app.include_router(index_naver)

#--------------------
#종목 코드 찾아주기
app.include_router(search_code)

# --------------------------------------------------
# 애플리케이션 실행
# --------------------------------------------------
if __name__ == "__main__":
    import uvicorn
    # 파일명이 main.py라면 "main:app"으로 실행 (실제 파일명에 맞게 수정)
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)

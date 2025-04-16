// src/pages/companyMain.js
import React, { useEffect, useState } from "react";
import ChartComponent from "./chartData";
import PriceStats from "./priceStats";
import DataTable from "./dataTable";

// 전일 대비 가격 변동에 따라 부호 심볼을 리턴하는 함수
const getSignSymbolFromVrss = (vrss) => {
  const v = Number(vrss);
  if (v > 0) return "▲";
  if (v < 0) return "▼";
  return "–";
};

const CompanyMain = () => {
  // 웹소켓을 통한 실시간 가격 상태
  const [wsPrice, setWsPrice] = useState(null);
  // REST API를 통해 가져온 체결 데이터 상태
  const [chartData, setChartData] = useState([]);

  // 현재 시각을 기반으로 장 마감 여부 판단 (15:30 이후면 마감)
  const now = new Date();
  const marketClosed =
    now.getHours() > 15 || (now.getHours() === 15 && now.getMinutes() >= 30);
  const priceLabel = marketClosed ? "마감가" : "현재가";

  // --------------------------------------------------
  // [웹소켓 연결 설정]
  // --------------------------------------------------
  useEffect(() => {
    // 시장 마감 시에는 웹소켓 연결을 하지 않음

    // FastAPI 백엔드의 웹소켓 엔드포인트 (ws://localhost:8000/ws)
    const ws = new WebSocket("ws://localhost:8000/ws");

    ws.onopen = () => {
      console.log("[WS] 웹소켓 연결 성공");
    };

    ws.onmessage = (event) => {
      const rawData = event.data;
      console.log("[WS] 수신한 원시 데이터:", rawData);

      // PINGPONG, SUBSCRIBE 등 시스템 메시지는 무시
      if (rawData.includes("PINGPONG") || rawData.includes("SUBSCRIBE")) return;

      // 데이터 포맷 예: "필드1|필드2|필드3|필드1^필드2^실시간가격^..."
      const parts = rawData.split("|");
      if (parts.length < 4) return;
      const dataPart = parts[3];
      const fields = dataPart.split("^");
      // 실시간 가격은 세번째 필드(인덱스 2)로 가정
      const livePrice = fields[2];
      console.log("[WS] 파싱 후 실시간 가격:", livePrice);
      setWsPrice(livePrice);
    };

    ws.onerror = (error) => {
      console.error("[WS] 웹소켓 에러:", error);
    };

    ws.onclose = () => {
      console.log("[WS] 웹소켓 연결 종료");
    };

    return () => ws.close();
  }, [marketClosed]);

  // --------------------------------------------------
  // [REST API를 통한 체결 데이터 가져오기]
  // --------------------------------------------------
  useEffect(() => {
    const fetchTickData = async () => {
      try {
        const response = await fetch(
          "http://localhost:8000/stock/time-conclusion?iscd=005930"
        );
        const json = await response.json();
        console.log("[REST] 전체 응답 데이터:", json);
        if (!json || !json.data) return;

        // API에서 반환된 데이터를 그대로 사용 (예: time: "090000", "091500", ...)
        const formatted = json.data.map((item) => {
          const formattedItem = {
            time: item.time,
            price: Number(item.price),
            prdy_vrss: item.prdy_vrss,
            prdy_sign: item.prdy_sign,
            prdy_ctrt: item.prdy_ctrt,
            volume: Number(item.volume),
          };
          return formattedItem;
        });
        setChartData(formatted);
      } catch (err) {
        console.error("💥 fetch 에러 발생:", err);
      }
    };
    fetchTickData();
  }, []);

  // 체결 데이터가 아직 로드되지 않았다면 로딩 메시지 출력
  if (chartData.length === 0) {
    return <div>📉 데이터를 불러오는 중입니다...</div>;
  }

  // 최신 데이터는 REST API 데이터의 마지막 항목
  const lastData = chartData[chartData.length - 1];

  // 가격 표시: 장중에는 웹소켓 실시간 가격(wsPrice) 우선, 없으면 REST API 가격 사용
  const displayPrice =
    !marketClosed && wsPrice !== null
      ? `${Number(wsPrice).toLocaleString()}원`
      : `${Number(lastData.price).toLocaleString()}원 (${priceLabel})`;

  // 전일 대비 요약 정보 계산
  const signSymbol = getSignSymbolFromVrss(lastData.prdy_vrss);
  const changeColor =
    Number(lastData.prdy_vrss) > 0
      ? "red"
      : Number(lastData.prdy_vrss) < 0
      ? "blue"
      : "gray";
  const changeAmount = `${signSymbol}${Math.abs(
    Number(lastData.prdy_vrss)
  ).toLocaleString()}원`;
  const changeRate = `${Number(lastData.prdy_ctrt).toFixed(2)}%`;

  // 시가, 고가, 저가, 종가 계산
  const prices = chartData.map((d) => d.price);
  const open = prices[0];
  const high = Math.max(...prices);
  const low = Math.min(...prices);
  const close = lastData.price;

  return (
    <div style={{ width: "100%", padding: "20px", boxSizing: "border-box" }}>
      {/* 상단 요약 */}
      <div
        style={{
          marginBottom: "20px",
          display: "flex",
          alignItems: "flex-end",
        }}
      >
        <div
          style={{ fontSize: "22px", fontWeight: "bold", marginRight: "10px" }}
        >
          삼성전자 {displayPrice}
        </div>
        <div
          style={{ color: changeColor, fontSize: "18px", fontWeight: "bold" }}
        >
          {changeAmount} ({changeRate})
        </div>
      </div>

      {/* 차트와 시세 카드 */}
      <div style={{ display: "flex", gap: "20px", marginBottom: "30px" }}>
        <div style={{ flex: 3, height: "400px" }}>
          <ChartComponent chartData={chartData} />
        </div>
        <PriceStats
          open={open}
          close={close}
          high={high}
          low={low}
          priceLabel={priceLabel}
        />
      </div>

      {/* 데이터 표 */}
      <h3 style={{ marginTop: "40px", textAlign: "center" }}>데이터 확인</h3>
      <DataTable chartData={chartData} />
    </div>
  );
};

export default CompanyMain;

// src/pages/companyMain.js
import React, { useEffect, useState } from "react";
import ChartComponent from "./chartData";
import PriceStats from "./priceStats";
import DataTable from "./dataTable";

const getSignSymbolFromVrss = (vrss) => {
  const v = Number(vrss);
  if (v > 0) return "▲";
  if (v < 0) return "▼";
  return "–";
};

const CompanyMain = () => {
  const [wsPrice, setWsPrice] = useState(null); // 웹소켓 실시간 가격
  const [chartData, setChartData] = useState([]); // REST API 체결 데이터

  // 현재 시각에 따른 장 마감 여부 판단
  const now = new Date();
  const marketClosed =
    now.getHours() > 15 || (now.getHours() === 15 && now.getMinutes() >= 30);
  const priceLabel = marketClosed ? "마감가" : "현재가";

  // 웹소켓 연결 (장이 열려 있을 때만)
  useEffect(() => {
    if (marketClosed) return;

    const ws = new WebSocket("ws://localhost:8000/ws");
    ws.onmessage = (event) => {
      const rawData = event.data;
      if (rawData.includes("PINGPONG") || rawData.includes("SUBSCRIBE")) return;
      const parts = rawData.split("|");
      if (parts.length < 4) return;
      const dataPart = parts[3];
      const fields = dataPart.split("^");
      const livePrice = fields[2];
      setWsPrice(livePrice);
    };

    return () => ws.close();
  }, [marketClosed]);

  // REST API를 통해 체결 데이터(fetch) 가져오기
  useEffect(() => {
    const fetchTickData = async () => {
      try {
        const response = await fetch(
          "http://localhost:8000/stock/time-conclusion?iscd=005930"
        );
        const json = await response.json();
        if (!json || !json.data) return;

        // "093000" → "09:30" 변환 및 거래량 증감 계산
        const formatted = json.data.map((item, index, arr) => {
          const hour = item.time.slice(0, 2);
          const min = item.time.slice(2, 4);
          const currentVolume = Number(item.volume);
          const prevVolume = index > 0 ? Number(arr[index - 1].volume) : 0;
          const volumeDelta = currentVolume - prevVolume;
          return {
            time: `${hour}:${min}`,
            price: Number(item.price),
            prdy_vrss: item.prdy_vrss,
            prdy_sign: item.prdy_sign,
            prdy_ctrt: item.prdy_ctrt,
            volume: volumeDelta > 0 ? volumeDelta : 0,
          };
        });
        setChartData(formatted);
      } catch (err) {
        console.error("💥 fetch 에러 발생:", err);
      }
    };
    fetchTickData();
  }, []);

  if (chartData.length === 0) {
    return <div>📉 데이터를 불러오는 중입니다...</div>;
  }

  // 최신 데이터 (REST API의 마지막 체결 데이터)
  const lastData = chartData[chartData.length - 1];

  // 가격 표시는: 장이 열려 있으면 웹소켓 가격(wsPrice)이 있을 경우 우선, 없으면 REST API 가격 사용
  const displayPrice =
    !marketClosed && wsPrice !== null
      ? `${Number(wsPrice).toLocaleString()}원`
      : `${Number(lastData.price).toLocaleString()}원 (${priceLabel})`;

  // 상단 요약 정보 (전일 대비 등)
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

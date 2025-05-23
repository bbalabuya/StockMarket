import React, { useEffect, useState } from "react";
import ChartComponent from "./chartData";
import PriceStats from "./priceStats";
import DataTable from "./dataTable";
import { useNavigate } from "react-router-dom";

const getSignSymbolFromVrss = (vrss) => {
  const v = Number(vrss);
  if (v > 0) return "▲";
  if (v < 0) return "▼";
  return "–";
};

const isMarketOpen = () => {
  const now = new Date();
  const hour = now.getHours();
  const minute = now.getMinutes();
  return (
    (hour > 9 || (hour === 9 && minute >= 0)) &&
    (hour < 15 || (hour === 15 && minute < 30))
  );
};

const CompanyMain = () => {
  const [wsPrice, setWsPrice] = useState(null);
  const queryParams = new URLSearchParams(window.location.search);
  const [chartData, setChartData] = useState([]);
  const [stockCode, setStockCode] = useState(queryParams.get("code"));
  const [inputCode, setInputCode] = useState(queryParams.get("code"));
  const [prevClose, setPrevClose] = useState(null); // 전일 종가
  const [stockInfo, setStockInfo] = useState(null);
  const [changeAmount, setChangeAmount] = useState(null);
  const [changeRate, setChangeRate] = useState(null);

  const marketClosed = !isMarketOpen();
  const priceLabel = marketClosed ? "마감가" : "현재가";
  ///////////////////
  //websocket
  //////////////////
  useEffect(() => {
    if (!isMarketOpen()) {
      console.log("[WS] 현재 시각 장 외 시간. 웹소켓 연결 생략");
      return;
    }

    const ws = new WebSocket(`ws://localhost:8000/ws?code=${stockCode}`);
    console.log("[WS] 웹소켓 연결 시도 중...");

    ws.onopen = () => {
      console.log("[WS] 웹소켓 연결 성공");
    };

    ws.onmessage = (event) => {
      const rawData = event.data;
      if (rawData.includes("PINGPONG") || rawData.includes("SUBSCRIBE")) return;

      const parts = rawData.split("|");
      if (parts.length < 4) return;

      const dataPart = parts[3];
      const fields = dataPart.split("^");

      const livePrice = fields[2]; // 실시간 체결가
      const prdy_vrss = fields[4]; // 전일대비
      const prdy_ctrt = fields[5]; // 전일대비율

      setWsPrice(livePrice);
      setChangeAmount(prdy_vrss);
      setChangeRate(prdy_ctrt);
    };

    ws.onerror = (error) => {
      console.error("[WS] 에러 발생:", error);
    };

    ws.onclose = () => {
      console.log("[WS] 웹소켓 종료");
    };

    return () => ws.close();
  }, [stockCode]);
  ///////////////
  //websocket
  //////////////
  //시간별 데이터터
  /////////////
  useEffect(() => {
    const fetchTickData = async () => {
      try {
        const response = await fetch(
          `http://localhost:8000/stock/time-conclusion?iscd=${stockCode}`
        );
        const json = await response.json();
        console.log("[REST] 전체 응답 데이터:", json);

        if (!json || !json.data) return;

        const formatted = json.data.map((item) => ({
          time: item.time,
          price: Number(item.price),
          prdy_vrss: item.prdy_vrss,
          prdy_sign: item.prdy_sign,
          prdy_ctrt: item.prdy_ctrt,
          volume: Number(item.volume),
        }));

        setChartData(formatted);
        setPrevClose(Number(json.data[0].price)); // 첫 데이터의 가격을 전일 종가로 저장
      } catch (err) {
        console.error("💥 fetch 에러 발생:", err);
      }
    };

    fetchTickData();
  }, [stockCode]);
  /////////////
  //시간별 데이터
  ////////////
  //PER,PBR
  ///////////

  useEffect(() => {
    const fetchStockInfo = async () => {
      try {
        const response = await fetch(
          `http://localhost:8000/stock/info?iscd=${stockCode}`
        );
        const data = await response.json();
        setStockInfo(data);
      } catch (error) {
        console.error("주식 정보 가져오기 실패:", error);
      }
    };

    if (stockCode) fetchStockInfo();
  }, [stockCode]);
  /////////////
  //PER,PBR
  ////////////

  if (chartData.length === 0 || prevClose === null) {
    return <div>📉 데이터를 불러오는 중입니다...</div>;
  }

  const lastData = chartData[chartData.length - 1];
  const currentPrice =
    isMarketOpen() && wsPrice !== null
      ? Number(wsPrice)
      : Number(lastData.price);

  const signSymbol = getSignSymbolFromVrss(changeAmount);
  const changeColor =
    Number(changeAmount) > 0
      ? "red"
      : Number(changeAmount) < 0
      ? "blue"
      : "gray";
  const displayChangeAmount = `${signSymbol}${Math.abs(
    Number(changeAmount)
  ).toLocaleString()}원`;
  const displayChangeRate = `${parseFloat(changeRate).toFixed(2)}%`;

  const displayPrice = `${Number(
    currentPrice
  ).toLocaleString()}원 (${priceLabel})`;

  const prices = chartData.map((d) => d.price);
  const open = prices[0];
  const high = Math.max(...prices);
  const low = Math.min(...prices);
  const close = lastData.price;

  const handleSearch = () => {
    if (inputCode.trim()) {
      setStockCode(inputCode.trim());
      setWsPrice(null); // 새 종목 검색 시 초기화
      setPrevClose(null);
    }
  };

  return (
    <div style={{ width: "100%", padding: "20px", boxSizing: "border-box" }}>
      <div style={{ marginBottom: "20px" }}>
        <input
          type="text"
          value={inputCode}
          onChange={(e) => setInputCode(e.target.value)}
          placeholder="종목 코드를 입력하세요 (예: 005930)"
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          style={{ padding: "8px", fontSize: "16px", marginRight: "10px" }}
        />
        <button onClick={handleSearch} style={{ padding: "8px 12px" }}>
          검색
        </button>
      </div>

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
          종목코드 {stockCode} {displayPrice}
        </div>
        <div
          style={{ color: changeColor, fontSize: "18px", fontWeight: "bold" }}
        >
          {displayChangeAmount} ({displayChangeRate})
        </div>
      </div>

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
      <div>
        <h3>📈 기본 주식 정보</h3>
        <ul style={{ lineHeight: "1.8em" }}>
          <li>
            <strong>PER:</strong> {stockInfo.PER}
          </li>
          <li>
            <strong>PBR:</strong> {stockInfo.PBR}
          </li>
          <li>
            <strong>시가총액:</strong> {stockInfo["시가총액"]}
          </li>
          <li>
            <strong>유통주식수:</strong> {stockInfo["유통주식수"]}
          </li>
        </ul>
      </div>
      <h3 style={{ marginTop: "40px", textAlign: "center" }}>데이터 확인</h3>
      <DataTable chartData={chartData} />
    </div>
  );
};

export default CompanyMain;

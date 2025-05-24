import React, { useState } from "react";
import SearchBar from "./SearchBar";
import StockHeader from "./StockHeader";
import ChartArea from "./ChartArea";
import DataSection from "./DataSection";
import useStockData from "../useStockData";
import { handleSubmit } from "../findStockCode";

export default function CompanyMain() {
  const params = new URLSearchParams(window.location.search);
  const initial = params.get("code");
  const [stockCode, setStockCode] = useState(initial);
  const [inputCode, setInputCode] = useState(initial);

  const {
    chartData,
    wsPrice,
    changeAmount,
    changeRate,
    prevClose,
    stockInfo,
    marketOpen,
  } = useStockData(stockCode);

  if (!chartData.length) return <div>📉 데이터를 불러오는 중입니다...</div>;

  const currentPrice =
    marketOpen && wsPrice != null
      ? Number(wsPrice)
      : chartData[chartData.length - 1].price;

  const changeColor =
    Number(changeAmount) > 0
      ? "red"
      : Number(changeAmount) < 0
      ? "blue"
      : "gray";

  const priceLabel = marketOpen ? "현재가" : "마감가";

  // CompanyMain.js 내부
  const onSearch = async (e) => {
    if (e && e.preventDefault) e.preventDefault(); // ✅ 여기에서만 이벤트 방지 처리

    if (!inputCode.trim()) return;

    const code = await handleSubmit(inputCode);

    if (code) {
      setStockCode(code);
      setInputCode(code);
      const url = new URL(window.location);
      url.searchParams.set("code", code);
      window.history.pushState({}, "", url);
    } else {
      alert("종목을 찾을 수 없습니다.");
    }
  };

  return (
    <div style={{ width: "100%", padding: 20, boxSizing: "border-box" }}>
      <SearchBar
        inputCode={inputCode}
        setInputCode={setInputCode}
        onSearch={onSearch}
      />
      <StockHeader
        stockCode={stockCode}
        currentPrice={currentPrice}
        priceLabel={priceLabel}
        changeAmount={changeAmount}
        changeRate={changeRate}
        changeColor={changeColor}
      />
      <ChartArea chartData={chartData} priceLabel={priceLabel} />
      <DataSection stockInfo={stockInfo} chartData={chartData} />
    </div>
  );
}

import React, { useState } from "react";
import SearchBar from "./SearchBar";
import StockHeader from "./StockHeader";
import ChartArea from "./ChartArea";
import DataSection from "./DataSection";
import useStockData from "../useStockData";

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

  const onSearch = () => {
    if (!inputCode.trim()) return;
    setStockCode(inputCode.trim());
  };

  const sampleChartData = [
    { time: "090000", price: 70300, prdy_vrss: 0, prdy_ctrt: 0.0, volume: 150 },
    {
      time: "090100",
      price: 70500,
      prdy_vrss: 200,
      prdy_ctrt: 0.28,
      volume: 300,
    },
    {
      time: "090200",
      price: 70800,
      prdy_vrss: 500,
      prdy_ctrt: 0.71,
      volume: 250,
    },
    {
      time: "090300",
      price: 70600,
      prdy_vrss: 300,
      prdy_ctrt: 0.42,
      volume: 200,
    },
    {
      time: "090400",
      price: 70700,
      prdy_vrss: 400,
      prdy_ctrt: 0.57,
      volume: 180,
    },
    {
      time: "090500",
      price: 70900,
      prdy_vrss: 600,
      prdy_ctrt: 0.85,
      volume: 220,
    },
    {
      time: "090600",
      price: 71100,
      prdy_vrss: 800,
      prdy_ctrt: 1.14,
      volume: 190,
    },
    {
      time: "090700",
      price: 71000,
      prdy_vrss: 700,
      prdy_ctrt: 1.0,
      volume: 160,
    },
    {
      time: "090800",
      price: 71200,
      prdy_vrss: 900,
      prdy_ctrt: 1.28,
      volume: 230,
    },
  ];

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

// src/pages/CompanyMain.js

import React, { useState } from "react";
import { useLocation } from "react-router-dom";
import SearchBar from "./SearchBar";
import StockHeader from "./StockHeader";
import ChartArea from "./ChartArea";
import DataSection from "./DataSection";
import DataTable from "./dataTable";
import Call_index from "../call_index";
import Offer from "./Offer";
import { getStockCode } from "../findStockCode";

import useStockRest from "../RestCall";
import useStockWS from "../WSCall";

export default function CompanyMain() {
  const params = new URLSearchParams(window.location.search);
  const initial = params.get("code");
  const location = useLocation();
  const initialCompanyName = location.state?.companyName || "";

  const [stockCode, setStockCode] = useState(initial);
  const [companyName, setCompanyName] = useState(initialCompanyName);
  const [inputCode, setInputCode] = useState(initialCompanyName || initial);

  // REST API 데이터
  const { chartData, prevClose, stockInfo, marketOpen } =
    useStockRest(stockCode);

  // WebSocket 실시간 데이터
  const { wsPrice, changeAmount, changeRate } = useStockWS(stockCode);

  if (!chartData.length) return <div>📉 데이터를 불러오는 중입니다...</div>;

  const currentPrice =
    marketOpen && wsPrice != null
      ? Number(wsPrice)
      : chartData[chartData.length - 1]?.price ?? null;

  const setAmount =
    marketOpen && changeAmount != null
      ? Number(changeAmount)
      : chartData[chartData.length - 1]?.prdy_vrss ?? null;

  const setRate =
    marketOpen && changeRate != null
      ? Number(changeRate)
      : chartData[chartData.length - 1]?.prdy_ctrt ?? null;

  const changeColor =
    Number(setAmount) > 0 ? "red" : Number(setAmount) < 0 ? "blue" : "gray";

  const priceLabel = marketOpen ? "현재가" : "마감가";

  const onSearch = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!inputCode.trim()) return;

    const code = await getStockCode(inputCode);
    if (code) {
      setStockCode(code);
      setCompanyName(inputCode);
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
        companyName={companyName}
        setInputCode={setInputCode}
        onSearch={onSearch}
      />
      <StockHeader
        stockCode={stockCode}
        stockName={companyName}
        currentPrice={currentPrice}
        priceLabel={priceLabel}
        changeAmount={setAmount}
        changeRate={setRate}
        changeColor={changeColor}
      />
      <ChartArea chartData={chartData} priceLabel={priceLabel} />
      <DataSection stockInfo={stockInfo} />
      <Offer stockCode={stockCode} />
      <Call_index />
      <DataTable chartData={chartData} />
    </div>
  );
}

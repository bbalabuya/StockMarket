// src/pages/CompanyMain.js
import React, { useState } from "react";
import { useLocation } from "react-router-dom";
import SearchBar from "./SearchBar";
import StockHeader from "./StockHeader";
import ChartArea from "./ChartArea";
import DataSection from "./DataSection";
import useStockData from "../useStockData";
import { getStockCode } from "../findStockCode";
import DataTable from "./dataTable";
import Call_index from "../call_index";
import Offer from "./Offer";

export default function CompanyMain() {
  const params = new URLSearchParams(window.location.search);
  const initial = params.get("code");
  const location = useLocation();
  const initialCompanyName = location.state?.companyName || "";

  const [stockCode, setStockCode] = useState(initial);
  const [companyName, setCompanyName] = useState(initialCompanyName); // ✅ 상태로 관리
  const [inputCode, setInputCode] = useState(initialCompanyName || initial);

  const {
    chartData,
    wsPrice,
    changeAmount,
    changeRate,
    prevClose,
    stockInfo,
    marketOpen,
  } = useStockData(stockCode);
  // 필요한 데이터 useStockData.js에 한번에 불러와 뿌리기기

  if (!chartData.length) return <div>📉 데이터를 불러오는 중입니다...</div>;

  const currentPrice =
    marketOpen && wsPrice != null
      ? Number(wsPrice)
      : chartData[chartData.length - 1].price;

  const setAmount =
    marketOpen && wsPrice != null
      ? Number(changeAmount)
      : chartData[chartData.length - 1].prdy_vrss;

  const setRate =
    marketOpen && wsPrice != null
      ? Number(changeRate)
      : chartData[chartData.length - 1].prdy_ctrt;

  const changeColor =
    Number(setAmount) > 0 ? "red" : Number(setAmount) < 0 ? "blue" : "gray";

  const priceLabel = marketOpen ? "현재가" : "마감가";

  const onSearch = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!inputCode.trim()) return;

    const code = await getStockCode(inputCode); // 종목코드 불러오고 업데이트트
    if (code) {
      setStockCode(code);
      setCompanyName(inputCode); // ✅ 입력한 회사명을 상태로 반영
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
        stockName={companyName} // ✅ 업데이트된 회사명 전달
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

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

  const onSearch = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!inputCode.trim()) return;

    const code = await getStockCode(inputCode);
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
        changeAmount={changeAmount}
        changeRate={changeRate}
        changeColor={changeColor}
      />
      <ChartArea chartData={chartData} priceLabel={priceLabel} />
      <DataSection stockInfo={stockInfo} />
      <DataTable chartData={chartData} />
    </div>
  );
}

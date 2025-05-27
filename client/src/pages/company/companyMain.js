import React, { useState } from "react";
import { useLocation } from "react-router-dom";
import SearchBar from "./SearchBar";
import StockHeader from "./StockHeader";
import ChartArea from "./ChartArea";
import DataSection from "./DataSection";
import DataTable from "./dataTable";
import Call_index from "../call_index";
import { getStockCode } from "../findStockCode";
import Offer from "./Offer";

import useStockRest from "../RestCall";
import useStockWS from "../WSCall";

export default function CompanyMain() {
  const params = new URLSearchParams(window.location.search);
  const initialCode = params.get("code");
  const location = useLocation();
  const initialCompanyName = location.state?.companyName || "";

  const [stockCode, setStockCode] = useState(initialCode);
  const [inputCode, setInputCode] = useState(initialCompanyName || initialCode);
  const [companyName, setCompanyName] = useState(initialCompanyName);

  // REST API
  const { chartData, stockInfo, marketOpen } = useStockRest(stockCode);

  // WebSocket 실시간 시세 + 호가가
  const { price, changeAmount, changeRate, offer } = useStockWS(stockCode);

  if (!chartData.length) return <div>📉 데이터를 불러오는 중입니다...</div>;

  //주식 마감으로 운영되지 않을 경우 차트 값에서 불러옴옴
  const currentPrice =
    marketOpen && price != null
      ? Number(price)
      : chartData[chartData.length - 1]?.price ?? null;

  const setAmount =
    marketOpen && changeAmount != null
      ? Number(changeAmount)
      : chartData[chartData.length - 1]?.prdy_vrss ?? null;

  const setRate =
    marketOpen && changeRate != null
      ? Number(changeRate)
      : chartData[chartData.length - 1]?.prdy_ctrt ?? null;

  const changeColor = setAmount > 0 ? "red" : setAmount < 0 ? "blue" : "gray";
  const priceLabel = marketOpen ? "현재가" : "마감가";
  ///////////////////////////////////////////////////////

  const onSearch = async (e) => {
    e?.preventDefault();
    if (!inputCode.trim()) return;

    const code = await getStockCode(inputCode);
    if (code) {
      setStockCode(code);
      setCompanyName(inputCode);
      const url = new URL(window.location);
      url.searchParams.set("code", code);
      window.history.replaceState({}, "", url); // 뒤로 가기 방지 시 replaceState 사용
    } else {
      alert("❌ 종목을 찾을 수 없습니다.");
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

      <Offer offer={offer} />
      <Call_index />
      <DataTable chartData={chartData} />
    </div>
  );
}

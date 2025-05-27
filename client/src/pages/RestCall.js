// src/hooks/useStockRest.js
import { useState, useEffect } from "react";
import { isMarketOpen } from "./marketUtils";

const REST_TICKS = (code) =>
  `http://localhost:8000/stock/time-conclusion?iscd=${code}`;
const REST_INFO = (code) => `http://localhost:8000/stock/info?iscd=${code}`;

export default function useStockRest(stockCode) {
  const [chartData, setChartData] = useState([]);
  const [prevClose, setPrevClose] = useState(null);
  const [stockInfo, setStockInfo] = useState(null);

  const marketOpen = isMarketOpen();

  useEffect(() => {
    async function fetchData() {
      try {
        const tickRes = await fetch(REST_TICKS(stockCode)).then((r) =>
          r.json()
        );
        const data = tickRes.data || [];
        const fmt = data.map((i) => ({
          time: i.time,
          price: Number(i.price), // 현재 체결가
          prdy_vrss: i.prdy_vrss, // 어제 대비 변화량
          prdy_ctrt: i.prdy_ctrt, // 퍼센트 수치치
          volume: Number(i.volume),
        }));
        console.log(fmt);
        setChartData(fmt);
        setPrevClose(fmt[0]?.price ?? null);

        const infoRes = await fetch(REST_INFO(stockCode)).then((r) => r.json());
        setStockInfo(infoRes);
      } catch (err) {
        console.error("REST fetch error:", err);
      }
    }

    fetchData();
  }, [stockCode]);

  return {
    chartData,
    prevClose,
    stockInfo,
    marketOpen,
  };
}

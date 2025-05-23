import { useState, useEffect } from "react";
import { isMarketOpen } from "./marketUtils";

const WS_URL = (code) => `ws://localhost:8000/ws?code=${code}`;
const REST_TICKS = (code) =>
  `http://localhost:8000/stock/time-conclusion?iscd=${code}`;
const REST_INFO = (code) => `http://localhost:8000/stock/info?iscd=${code}`;

export default function useStockData(stockCode) {
  const [chartData, setChartData] = useState([]);
  const [wsPrice, setWsPrice] = useState(null);
  const [changeAmount, setChangeAmount] = useState(null);
  const [changeRate, setChangeRate] = useState(null);
  const [prevClose, setPrevClose] = useState(null);
  const [stockInfo, setStockInfo] = useState(null);

  const marketOpen = isMarketOpen();

  // 1) REST로 시간별/기초정보 가져오기
  useEffect(() => {
    async function load() {
      try {
        // ticks
        const tickRes = await fetch(REST_TICKS(stockCode)).then((r) =>
          r.json()
        );
        const data = tickRes.data || [];
        const fmt = data.map((i) => ({
          time: i.time,
          price: Number(i.price),
          prdy_vrss: i.prdy_vrss,
          prdy_ctrt: i.prdy_ctrt,
          volume: Number(i.volume),
        }));
        setChartData(fmt);
        setPrevClose(fmt[0]?.price ?? null);
        console.log("REST ticks:", fmt); // ✅ 로그 추가

        if (!marketOpen && fmt.length) {
          const last = fmt[fmt.length - 1];
          setWsPrice(last.price);
          setChangeAmount(last.prdy_vrss);
          setChangeRate(last.prdy_ctrt);
        }

        // 기본정보
        const infoRes = await fetch(REST_INFO(stockCode)).then((r) => r.json());
        setStockInfo(infoRes);
        console.log("REST info:", infoRes); // ✅ 로그 추가
      } catch (err) {
        console.error("REST fetch error:", err);
      }
    }
    load();
  }, [stockCode, marketOpen]);

  // 2) WS (장 운영 시간에만)
  useEffect(() => {
    if (!marketOpen) return;
    const ws = new WebSocket(WS_URL(stockCode));
    ws.onmessage = (e) => {
      const d = e.data;
      if (d.includes("PINGPONG") || d.includes("SUBSCRIBE")) return;
      const parts = d.split("|");
      if (parts.length < 4) return;
      const fields = parts[3].split("^");

      console.log("WS message fields:", fields); // ✅ 로그 추가

      setWsPrice(fields[2]);
      setChangeAmount(fields[4]);
      setChangeRate(fields[5]);
    };
    return () => ws.close();
  }, [stockCode, marketOpen]);

  return {
    chartData,
    wsPrice,
    changeAmount,
    changeRate,
    prevClose,
    stockInfo,
    marketOpen,
  };
}

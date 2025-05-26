// src/hooks/useStockWS.js
import { useState, useEffect } from "react";
import { isMarketOpen } from "./marketUtils";

const WS_URL = (code) => `ws://localhost:8000/ws?code=${code}`;

export default function useStockWS(stockCode) {
  const [wsPrice, setWsPrice] = useState(null);
  const [changeAmount, setChangeAmount] = useState(null);
  const [changeRate, setChangeRate] = useState(null);

  const marketOpen = isMarketOpen();

  useEffect(() => {
    if (!marketOpen) {
      return;
    }

    const ws = new WebSocket(WS_URL(stockCode));
    ws.onopen = () => console.log("WS 연결됨:", stockCode);
    ws.onmessage = (e) => {
      const d = e.data;
      if (d.includes("PINGPONG")) return;
      const parts = d.split("|");
      if (parts.length < 4) return;
      const fields = parts[3].split("^");

      setWsPrice(fields[2]);
      setChangeAmount(fields[4]);
      setChangeRate(fields[5]);
    };
    ws.onerror = (e) => console.error("WS 오류:", e);
    ws.onclose = () => console.log("WS 닫힘:", stockCode);

    return () => ws.close();
  }, [stockCode, marketOpen]);

  return {
    wsPrice,
    changeAmount,
    changeRate,
    marketOpen,
  };
}

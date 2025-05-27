// src/WSCall.js
import { useState, useEffect } from "react";
import { isMarketOpen } from "./marketUtils";

export default function useStockWS(stockCode) {
  const [price, setPrice] = useState(null); // 체결가
  const [changeAmount, setChangeAmount] = useState(null); // 전일 대비 금액
  const [changeRate, setChangeRate] = useState(null); // 전일 대비 비율
  const [offer, setOffer] = useState(null); // 호가

  useEffect(() => {
    if (
      !stockCode
      //|| !isMarketOpen()
    )
      return;

    const ws = new WebSocket(`ws://localhost:8000/ws/all?code=${stockCode}`);

    ws.onopen = () => {
      console.log("📡 WebSocket 연결 완료 (/ws/all)");
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        const { tr_id, output } = data;

        if (tr_id === "H0STCNT0") {
          // 체결가 데이터 처리리
          console.log("체결가 데이터 받아옴");
          const parts = output.split("^");
          const price = parts[2]; // 현재가
          const changeAmt = parts[4]; // 전일 대비 금액
          const changeRt = parts[5]; // 전일 대비 비율
          console.log(price, changeAmt, changeRt);

          setPrice(price);
          setChangeAmount(changeAmt);
          setChangeRate(changeRt);
        }

        if (tr_id === "H0STASP0") {
          // 호가 데이터 (백에서 처리리)
          console.log("호가 데이터 받아옴");
          setOffer(output);
        }
      } catch (err) {
        console.error("❌ WebSocket 수신 오류:", err);
      }
    };

    ws.onerror = (e) => console.error("❌ WebSocket 에러:", e);
    ws.onclose = () => console.log("🔌 WebSocket 종료");

    return () => ws.close();
  }, [stockCode]);

  return { price, changeAmount, changeRate, offer };
}

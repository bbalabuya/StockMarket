import React, { useEffect, useState } from "react";
import { isMarketOpen } from "../marketUtils";

export default function Offer({ stockCode }) {
  const [offerData, setOfferData] = useState(null);
  const [ws, setWs] = useState(null); // WebSocket 임시 저장

  useEffect(() => {
    if (!stockCode) return;

    if (!isMarketOpen()) {
      console.log("Offer 주식 운영시간이 아님");
      return;
    }

    const socket = new WebSocket(
      `ws://localhost:8000/ws/offer?code=${stockCode}`
    );
    setWs(socket);

    socket.onopen = () => {
      console.log("📡 WebSocket 연결됨 (호가)");
    };

    socket.onmessage = (event) => {
      try {
        const raw = JSON.parse(event.data);
        if (raw?.body?.output) {
          setOfferData(raw.body.output);
        }
      } catch (e) {
        console.error("❌ 호가 데이터 파싱 실패:", e);
      }
    };

    socket.onerror = (error) => {
      console.error("❌ WebSocket 오류 (호가):", error);
    };

    socket.onclose = () => {
      console.log("🔌 WebSocket 연결 종료 (호가)");
    };

    return () => {
      socket.close();
    };
  }, [stockCode]);

  if (!offerData) return <div>📦 호가 데이터를 불러오는 중...</div>;

  return (
    <div style={{ marginTop: 20 }}>
      <h3>📊 실시간 호가</h3>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ background: "#f0f0f0" }}>
            <th>매도호가</th>
            <th>매수호가</th>
          </tr>
        </thead>
        <tbody>
          {[...Array(10)].map((_, idx) => {
            const askPrice = offerData[`askp${idx + 1}`]; // 매도호가
            const bidPrice = offerData[`bidp${idx + 1}`]; // 매수호가
            return (
              <tr key={idx}>
                <td style={{ color: "red", textAlign: "center" }}>
                  {askPrice}
                </td>
                <td style={{ color: "blue", textAlign: "center" }}>
                  {bidPrice}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

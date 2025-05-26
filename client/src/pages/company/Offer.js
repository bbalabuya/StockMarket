//offer
import React, { useEffect, useState } from "react";
import { isMarketOpen } from "../marketUtils";

export default function Offer({ stockCode }) {
  const [offer, setOffer] = useState(null);
  const [ws, setWs] = useState(null);

  useEffect(() => {
    if (!stockCode || !isMarketOpen()) return;

    const socket = new WebSocket(
      `ws://localhost:8000/ws/offer?code=${stockCode}`
    );
    setWs(socket);

    socket.onopen = () => console.log("📡 호가 WS 연결 완료");
    socket.onmessage = ({ data }) => {
      try {
        const parsed = JSON.parse(data);
        if (parsed?.output) setOffer(parsed.output);
      } catch {
        // 서버에서 이미 JSON만 내려오므로 거의 안 옵니다.
      }
    };
    socket.onerror = (e) => console.error("❌ 호가 WS 오류:", e);
    socket.onclose = () => console.log("🔌 호가 WS 종료");

    return () => socket.close();
  }, [stockCode]);

  if (!offer) return <div>📦 호가 데이터를 불러오는 중...</div>;

  return (
    <div className="mt-5">
      <h3>📊 실시간 호가</h3>
      <table className="w-full border-collapse text-center">
        <thead>
          <tr className="bg-gray-100">
            <th>매도호가</th>
            <th>매수호가</th>
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: 10 }, (_, i) => (
            <tr key={i}>
              <td className="text-red-600">{offer[`askp${i + 1}`]}</td>
              <td className="text-blue-600">{offer[`bidp${i + 1}`]}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

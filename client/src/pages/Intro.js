// 경로 수정, 컴포넌트 대체 포함
import React, { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
// 아이콘 import 제거 혹은 설치 후 사용
// import { Clock } from "lucide-react";

// Card 대체 컴포넌트
const Card = ({ children, className }) => (
  <div className={`bg-white border rounded-xl p-4 ${className}`}>
    {children}
  </div>
);
const CardContent = ({ children, className }) => (
  <div className={`${className}`}>{children}</div>
);

export default function StockPrice() {
  const [price, setPrice] = useState(null);
  const [tickData, setTickData] = useState([]);

  useEffect(() => {
    const ws = new WebSocket("ws://localhost:8000/ws");

    ws.onmessage = (event) => {
      const rawData = event.data;
      if (rawData.includes("PINGPONG") || rawData.includes("SUBSCRIBE")) return;

      const parts = rawData.split("|");
      if (parts.length < 4) return;

      const dataPart = parts[3];
      const fields = dataPart.split("^");
      const price = fields[2];

      setPrice(price);
    };

    return () => ws.close();
  }, []);

  useEffect(() => {
    const fetchTickData = async () => {
      try {
        const response = await fetch("http://localhost:8000/stock/005930");
        const json = await response.json();

        if (json.output) {
          const chartData = json.output.slice(-20).map((item) => {
            const t = item.stck_cls_time;
            const timeFormatted = `${t.slice(0, 2)}:${t.slice(2, 4)}`;
            return {
              time: timeFormatted,
              price: Number(item.stck_prpr),
            };
          });

          setTickData(chartData);
        }
      } catch (err) {
        console.error("데이터 로딩 실패:", err);
      }
    };

    fetchTickData();
  }, []);

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-2">📈 실시간 체결가</h2>
      <p className="text-lg mb-4">
        삼성전자 체결가: {price ? `${price}원` : "수신 대기 중..."}
      </p>

      <div className="flex items-center gap-2 mb-2">
        <span role="img" aria-label="clock">
          🕒
        </span>
        <h3 className="text-lg font-semibold">1분 전까지의 체결가 추이</h3>
      </div>

      <Card className="w-full h-80 border-dashed border-2 border-gray-300">
        <CardContent className="h-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={tickData}>
              <XAxis dataKey="time" tick={{ fontSize: 12 }} />
              <YAxis domain={["dataMin - 50", "dataMax + 50"]} />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="price"
                stroke="#8884d8"
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}

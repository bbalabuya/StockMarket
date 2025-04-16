import React, { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

// Helper 함수: 주어진 prdy_vrss 값에 따라 기호 반환 (양수: ▲, 음수: ▼, 0: –)
const getSignSymbolFromVrss = (vrss) => {
  const v = Number(vrss);
  if (v > 0) return "▲";
  if (v < 0) return "▼";
  return "–";
};

export default function Test() {
  const [wsPrice, setWsPrice] = useState(null); // 웹소켓에서 받아온 실시간 가격
  const [chartData, setChartData] = useState([]); // REST API에서 가져온 체결 데이터

  // 현재 시간에 따라 장 마감 여부와 가격 라벨 결정
  const now = new Date();
  const marketClosed =
    now.getHours() > 15 || (now.getHours() === 15 && now.getMinutes() >= 30);
  const priceLabel = marketClosed ? "마감가" : "현재가";

  // 웹소켓 연결 (장이 열려 있을 때만)
  useEffect(() => {
    if (marketClosed) return; // 장 마감이면 웹소켓 연결하지 않음

    const ws = new WebSocket("ws://localhost:8000/ws");

    ws.onmessage = (event) => {
      const rawData = event.data;
      // PINGPONG, SUBSCRIBE 관련 메시지는 무시
      if (rawData.includes("PINGPONG") || rawData.includes("SUBSCRIBE")) return;

      const parts = rawData.split("|");
      if (parts.length < 4) return;

      const dataPart = parts[3];
      const fields = dataPart.split("^");
      const livePrice = fields[2]; // 웹소켓의 체결가 위치 (필드 인덱스에 따라 조정)

      setWsPrice(livePrice);
    };

    return () => ws.close();
  }, [marketClosed]);

  // REST API로 체결 데이터 (차트 데이터) 가져오기
  useEffect(() => {
    const fetchTickData = async () => {
      try {
        const response = await fetch(
          "http://localhost:8000/stock/time-conclusion?iscd=005930"
        );
        const json = await response.json();

        if (!json || !json.data) return;

        // "093000" → "09:30" 형태로 변환하고, 거래량 증가분 계산
        const formatted = json.data.map((item, index, arr) => {
          const hour = item.time.slice(0, 2);
          const min = item.time.slice(2, 4);

          const currentVolume = Number(item.volume);
          const prevVolume = index > 0 ? Number(arr[index - 1].volume) : 0;
          const volumeDelta = currentVolume - prevVolume;

          return {
            time: `${hour}:${min}`,
            price: Number(item.price),
            prdy_vrss: item.prdy_vrss,
            prdy_sign: item.prdy_sign,
            prdy_ctrt: item.prdy_ctrt,
            volume: volumeDelta > 0 ? volumeDelta : 0, // 체결량
          };
        });
        setChartData(formatted);
      } catch (err) {
        console.error("💥 fetch 에러 발생:", err);
      }
    };

    fetchTickData();
  }, []);

  if (chartData.length === 0) {
    return <div>📉 데이터를 불러오는 중입니다...</div>;
  }

  // 마지막 데이터 (REST API에서 가져온 가장 최신 체결 데이터)
  const lastData = chartData[chartData.length - 1];

  // 웹소켓 실시간 가격과 REST API 체결가 비교:
  // 장이 열려 있고(wsPrice가 있을 때) 우선 웹소켓 가격, 그렇지 않으면 REST API의 최신 가격 사용
  const displayPrice =
    !marketClosed && wsPrice !== null
      ? `${Number(wsPrice).toLocaleString()}원`
      : `${Number(lastData.price).toLocaleString()}원 (${priceLabel})`;

  // 상단 요약 정보: REST API의 데이터를 기준으로 전일 대비 등 계산 (원래 코드 유지)
  const signSymbol = getSignSymbolFromVrss(lastData.prdy_vrss);
  const changeColor =
    Number(lastData.prdy_vrss) > 0
      ? "red"
      : Number(lastData.prdy_vrss) < 0
      ? "blue"
      : "gray";
  const changeAmount = `${signSymbol}${Math.abs(
    Number(lastData.prdy_vrss)
  ).toLocaleString()}원`;
  const changeRate = `${Number(lastData.prdy_ctrt).toFixed(2)}%`;

  // 차트 관련 연산
  const prices = chartData.map((d) => d.price);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const open = prices[0];
  const close = lastData.price;
  const high = maxPrice;
  const low = minPrice;
  const priceRange = maxPrice - minPrice;
  let intervalUnit = 100;
  if (priceRange > 2000) intervalUnit = 1000;
  else if (priceRange > 1000) intervalUnit = 500;
  const yMargin = Math.max(300, Math.floor(priceRange * 0.3));
  const yMin = Math.floor((minPrice - yMargin) / intervalUnit) * intervalUnit;
  const yMax = Math.ceil((maxPrice + yMargin) / intervalUnit) * intervalUnit;
  const yTicks = [];
  for (let i = yMin; i <= yMax; i += intervalUnit) {
    yTicks.push(i);
  }

  return (
    <div style={{ width: "100%", padding: "20px", boxSizing: "border-box" }}>
      {/* 상단 요약 */}
      <div
        style={{
          marginBottom: "20px",
          display: "flex",
          alignItems: "flex-end",
        }}
      >
        <div
          style={{ fontSize: "22px", fontWeight: "bold", marginRight: "10px" }}
        >
          삼성전자 {displayPrice}
        </div>
        <div
          style={{ color: changeColor, fontSize: "18px", fontWeight: "bold" }}
        >
          {changeAmount} ({changeRate})
        </div>
      </div>

      {/* 차트 + 시세 카드 */}
      <div style={{ display: "flex", gap: "20px", marginBottom: "30px" }}>
        <div style={{ flex: 3, height: "400px" }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={chartData}
              margin={{ top: 40, right: 50, left: 10, bottom: 40 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" tick={{ fontSize: 12 }} />
              <YAxis
                yAxisId="left"
                domain={[yMin, yMax]}
                ticks={yTicks}
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => value.toLocaleString()}
              />
              <Tooltip
                formatter={(value, name) => {
                  if (name === "price")
                    return [`${value.toLocaleString()} 원`, "체결가"];
                  return value;
                }}
              />
              <Line
                type="monotone"
                dataKey="price"
                stroke="#8884d8"
                strokeWidth={2}
                dot={{ r: 2 }}
                name="체결가"
                isAnimationActive={false}
                yAxisId="left"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* 시세 요약 카드 */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            gap: "12px",
          }}
        >
          {[
            { label: "시가", value: open.toLocaleString() + "원" },
            { label: priceLabel, value: close.toLocaleString() + "원" },
            { label: "고가", value: high.toLocaleString() + "원" },
            { label: "저가", value: low.toLocaleString() + "원" },
          ].map((item, idx) => (
            <div
              key={idx}
              style={{
                backgroundColor: "#f9f9f9",
                border: "1px solid #ddd",
                borderRadius: "10px",
                padding: "12px",
                textAlign: "center",
                boxShadow: "0 2px 5px rgba(0,0,0,0.05)",
              }}
            >
              <div
                style={{ fontSize: "14px", color: "#888", marginBottom: "4px" }}
              >
                {item.label}
              </div>
              <div style={{ fontSize: "18px", fontWeight: "bold" }}>
                {item.value}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 하단 테이블 */}
      <h3 style={{ marginTop: "40px", textAlign: "center" }}>데이터 확인</h3>
      <div style={{ overflowX: "auto" }}>
        <table
          style={{
            borderCollapse: "collapse",
            width: "100%",
            boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
          }}
        >
          <thead>
            <tr style={{ backgroundColor: "#f0f0f0" }}>
              {["시간", "체결가", "전일 대비", "기호", "등락률", "거래량"].map(
                (label, idx) => (
                  <th
                    key={idx}
                    style={{
                      border: "1px solid #ccc",
                      padding: "8px",
                      textAlign: "center",
                      fontWeight: "600",
                      fontSize: "14px",
                    }}
                  >
                    {label}
                  </th>
                )
              )}
            </tr>
          </thead>
          <tbody>
            {chartData.map((item, idx) => (
              <tr
                key={idx}
                style={{
                  backgroundColor: idx % 2 === 0 ? "#fff" : "#f9f9f9",
                  transition: "background 0.2s",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.backgroundColor = "#e8f0ff")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.backgroundColor =
                    idx % 2 === 0 ? "#fff" : "#f9f9f9")
                }
              >
                <td style={tdStyle}>{item.time}</td>
                <td style={tdStyle}>{item.price?.toLocaleString()}</td>
                <td style={tdStyle}>
                  {Number(item.prdy_vrss).toLocaleString()}
                </td>
                <td style={tdStyle}>{getSignSymbolFromVrss(item.prdy_vrss)}</td>
                <td style={tdStyle}>{Number(item.prdy_ctrt).toFixed(2)}%</td>
                <td style={tdStyle}>{item.volume?.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const tdStyle = {
  border: "1px solid #ccc",
  padding: "8px",
  textAlign: "center",
};

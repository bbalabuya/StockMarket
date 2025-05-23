// src/pages/chartArea.js
import React from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

export default function ChartArea({ chartData, priceLabel }) {
  const prices = chartData.map((d) => d.price);
  const open = prices[0];
  const high = Math.max(...prices);
  const low = Math.min(...prices);
  const close = prices[prices.length - 1];

  // Y축 계산
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
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
    <div style={{ display: "flex", gap: 20, marginBottom: 30 }}>
      <div style={{ flex: 3, height: 400 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={chartData}
            margin={{ top: 40, right: 50, left: 10, bottom: 40 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="time"
              tick={{ fontSize: 12 }}
              tickFormatter={(time) => {
                if (time.length === 6) {
                  const hour = time.slice(0, 2);
                  const minute = time.slice(2, 4);
                  return `${hour}:${minute}`;
                }
                return time;
              }}
            />
            <YAxis
              yAxisId="left"
              domain={[yMin, yMax]}
              ticks={yTicks}
              tick={{ fontSize: 12 }}
              tickFormatter={(value) => value.toLocaleString()}
            />
            <Tooltip
              formatter={(value, name) => {
                if (name === "체결가")
                  return [`${value.toLocaleString()} 원`, name];
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

      {/* PriceStats 내부 정의 */}
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
  );
}

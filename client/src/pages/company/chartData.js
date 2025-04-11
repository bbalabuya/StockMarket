// src/pages/chartData.js
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

const ChartComponent = ({ chartData }) => {
  // 차트에 필요한 Y축 계산
  const prices = chartData.map((d) => d.price);
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
  );
};

export default ChartComponent;

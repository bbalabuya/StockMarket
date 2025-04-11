// src/pages/priceStats.js
import React from "react";

const PriceStats = ({ open, close, high, low, priceLabel }) => {
  const stats = [
    { label: "시가", value: open.toLocaleString() + "원" },
    { label: priceLabel, value: close.toLocaleString() + "원" },
    { label: "고가", value: high.toLocaleString() + "원" },
    { label: "저가", value: low.toLocaleString() + "원" },
  ];

  return (
    <div
      style={{ flex: 1, display: "flex", flexDirection: "column", gap: "12px" }}
    >
      {stats.map((item, idx) => (
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
          <div style={{ fontSize: "14px", color: "#888", marginBottom: "4px" }}>
            {item.label}
          </div>
          <div style={{ fontSize: "18px", fontWeight: "bold" }}>
            {item.value}
          </div>
        </div>
      ))}
    </div>
  );
};

export default PriceStats;

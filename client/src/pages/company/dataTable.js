// src/pages/dataTable.js
import React from "react";

const getSignSymbolFromVrss = (vrss) => {
  const v = Number(vrss);
  if (v > 0) return "▲";
  if (v < 0) return "▼";
  return "–";
};

const tdStyle = {
  border: "1px solid #ccc",
  padding: "8px",
  textAlign: "center",
};

const DataTable = ({ chartData }) => {
  return (
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
              <td style={tdStyle}>{Number(item.prdy_vrss).toLocaleString()}</td>
              <td style={tdStyle}>{getSignSymbolFromVrss(item.prdy_vrss)}</td>
              <td style={tdStyle}>{Number(item.prdy_ctrt).toFixed(2)}%</td>
              <td style={tdStyle}>{item.volume?.toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default DataTable;

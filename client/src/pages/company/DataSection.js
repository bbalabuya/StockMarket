import React from "react";
import DataTable from "./dataTable";

export default function DataSection({ stockInfo }) {
  const isLoading = !stockInfo;

  return (
    <>
      <div>
        <h3>📈 기본 주식 정보</h3>
        {isLoading ? (
          <p>📡 데이터를 불러오는 중입니다...</p>
        ) : (
          <ul style={{ lineHeight: 1.8 }}>
            <li>
              <strong>PER:</strong> {stockInfo.PER ?? "N/A"}
            </li>
            <li>
              <strong>PBR:</strong> {stockInfo.PBR ?? "N/A"}
            </li>
            <li>
              <strong>시가총액:</strong> {stockInfo["시가총액"] ?? "N/A"}
            </li>
            <li>
              <strong>유통주식수:</strong> {stockInfo["유통주식수"] ?? "N/A"}
            </li>
          </ul>
        )}
      </div>

      <h3 style={{ marginTop: 40, textAlign: "center" }}>데이터 확인</h3>
    </>
  );
}

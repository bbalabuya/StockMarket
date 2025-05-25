// src/components/MarketIndex.js
import React, { useEffect, useState } from "react";
import axios from "axios";

function Call_index() {
  const [data, setData] = useState(null);

  useEffect(() => {
    axios
      .get("http://localhost:8000/getKoreaIndex_naver")
      .then((res) => setData(res.data))
      .catch((err) => console.error("지수 불러오기 실패", err));
  }, []);

  const getColor = (direction) => {
    if (direction === "up") return "red";
    if (direction === "down") return "blue";
    return "gray";
  };

  const getArrow = (direction) => {
    if (direction === "up") return "▲";
    if (direction === "down") return "▼";
    return "-";
  };

  return (
    <div>
      <h3>시장 지수 (네이버 기준)</h3>
      {data ? (
        <>
          <div style={{ marginBottom: "1rem" }}>
            <h4>코스피</h4>
            <p>현재지수: {data.KOSPI.value}</p>
            <p style={{ color: getColor(data.KOSPI.direction) }}>
              전일대비: {getArrow(data.KOSPI.direction)} {data.KOSPI.diff}
            </p>
            <p style={{ color: getColor(data.KOSPI.direction) }}>
              등락률: {data.KOSPI.rate}%
            </p>
          </div>
          <div>
            <h4>코스닥</h4>
            <p>현재지수: {data.KOSDAQ.value}</p>
            <p style={{ color: getColor(data.KOSDAQ.direction) }}>
              전일대비: {getArrow(data.KOSDAQ.direction)} {data.KOSDAQ.diff}
            </p>
            <p style={{ color: getColor(data.KOSDAQ.direction) }}>
              등락률: {data.KOSDAQ.rate}%
            </p>
          </div>
        </>
      ) : (
        <p>데이터를 불러오는 중...</p>
      )}
    </div>
  );
}

export default Call_index;

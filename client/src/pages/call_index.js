// 예: src/components/MarketIndex.js
import React, { useEffect, useState } from "react";
import axios from "axios";

function Call_index() {
  const [data, setData] = useState({ KOSPI: "", KOSDAQ: "" });

  useEffect(() => {
    axios
      .get("http://localhost:8000/market-index/naver")
      .then((res) => setData(res.data))
      .catch((err) => console.error("지수 불러오기 실패", err));
  }, []);

  return (
    <div>
      <h3>시장 지수 (네이버 기준)</h3>
      <p>KOSPI: {data.KOSPI}</p>
      <p>KOSDAQ: {data.KOSDAQ}</p>
    </div>
  );
}

export default Call_index;

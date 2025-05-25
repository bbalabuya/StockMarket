import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { handleSubmit } from "./findStockCode"; // 분리된 함수 임포트
import Call_index from "./call_index";

const Landing = () => {
  const [indexData, setIndexData] = useState(null);
  const [error, setError] = useState("");
  const [companyName, setCompanyName] = useState("");
  const navigate = useNavigate();

  const fetchKoreaIndex = async () => {
    try {
      const response = await fetch("http://localhost:8000/getKoreaIndex");
      if (!response.ok) {
        throw new Error("지수 데이터를 가져오는 데 실패했습니다.");
      }
      const data = await response.json();
      setIndexData(data["코스피"]);
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    fetchKoreaIndex();
  }, []);

  return (
    <div style={{ padding: "20px" }}>
      <h2>📈 코스피 지수 정보</h2>

      {error && <p style={{ color: "red" }}>{error}</p>}

      {indexData ? (
        <div style={{ marginBottom: "20px" }}>
          <p>현재지수: {indexData["현재지수"]}</p>
          <p>전일대비: {indexData["전일대비"]}</p>
          <p>등락률: {indexData["등락률"]}</p>
          <p>거래량: {indexData["거래량"]}</p>
          <p>거래대금: {indexData["거래대금"]}</p>
        </div>
      ) : (
        <p>로딩 중...</p>
      )}

      <form // 여기서 종목이름을 코드로
        onSubmit={(e) => handleSubmit(e, companyName, setError, navigate)}
        style={{ marginTop: "40px" }}
      >
        <h3>🔍 회사 이름으로 종목 조회</h3>
        <input
          type="text"
          value={companyName}
          onChange={(e) => setCompanyName(e.target.value)}
          placeholder="예: 삼성전자"
          style={{ padding: "8px", width: "200px" }}
        />
        <button
          type="submit"
          style={{ marginLeft: "10px", padding: "8px 12px" }}
        >
          조회
        </button>
      </form>
    </div>
  );
};

export default Landing;

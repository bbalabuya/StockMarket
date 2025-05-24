import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const Landing = () => {
  const [indexData, setIndexData] = useState(null);
  const [error, setError] = useState("");
  const [companyName, setCompanyName] = useState(""); // 종목명 입력
  const navigate = useNavigate();

  const fetchKoreaIndex = async () => {
    try {
      const response = await fetch("http://localhost:8000/getKoreaIndex");
      if (!response.ok) {
        throw new Error("지수 데이터를 가져오는 데 실패했습니다.");
      }
      const data = await response.json();
      setIndexData(data["코스피"]); // 코스피 하나만 추출
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    fetchKoreaIndex();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!companyName.trim()) return;

    try {
      const response = await fetch(
        `http://localhost:8000/search-code?name=${encodeURIComponent(
          companyName
        )}`
      );
      const data = await response.json();
      console.log("✅ 서버 응답:", data);

      if (data.matches && data.matches.length > 0) {
        // 첫 번째 종목 코드 사용
        ////////페이지 이동
        navigate(`/stockinfo?code=${data.matches[0].Code}`);
        //////////////////
      } else {
        setError("종목을 찾을 수 없습니다.");
      }
    } catch (err) {
      setError("종목 코드 검색 중 오류 발생");
    }
  };

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

      {/* 종목명 입력 폼 */}
      <form onSubmit={handleSubmit} style={{ marginTop: "40px" }}>
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

// findStockCode.js

// companyMain 페이지에서 사용하는 용도도
export const getStockCode = async (companyName) => {
  try {
    const response = await fetch(
      `http://localhost:8000/search-code?name=${encodeURIComponent(
        companyName
      )}`
    );
    const data = await response.json();

    if (data.matches && data.matches.length > 0) {
      return data.matches[0].Code;
    }
    return null;
  } catch (err) {
    console.error("종목 코드 검색 중 오류 발생:", err);
    return null;
  }
};

// 기존 handleSubmit도 그대로 유지 (Landing.js용)
export const handleSubmit = async (e, companyName, setError, navigate) => {
  e.preventDefault();
  if (!companyName.trim()) return;

  try {
    const response = await fetch(
      `http://localhost:8000/search-code?name=${encodeURIComponent(
        companyName
      )}`
    );
    const data = await response.json();

    if (data.matches && data.matches.length > 0) {
      const { Code, Name } = data.matches[0];
      navigate(`/stockinfo?code=${Code}`, {
        state: { companyName: Name },
      });
    } else {
      setError("종목을 찾을 수 없습니다.");
    }
  } catch (err) {
    console.error(err);
    setError("종목 코드 검색 중 오류 발생");
  }
};

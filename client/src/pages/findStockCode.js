// findStockCode.js
export const handleSubmit = async (e, companyName, setError, navigate) => {
  e.preventDefault();

  try {
    const response = await fetch(
      `http://localhost:8000/findStockCode?companyName=${companyName}`
    );
    const data = await response.json();

    if (data.code) {
      navigate(`/companyMain?code=${data.code}`, {
        state: { name: companyName }, // ✅ 종목 이름은 state로 전달
      });
    } else {
      setError("종목 코드를 찾을 수 없습니다.");
    }
  } catch (error) {
    console.error(error);
    setError("요청 중 오류가 발생했습니다.");
  }
};

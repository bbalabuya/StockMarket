import { useEffect, useRef } from "react";

export default function SearchBar({
  inputCode,
  companyName,
  setInputCode,
  onSearch,
}) {
  const initialized = useRef(false); // 초기화 여부 추적

  useEffect(() => {
    if (!initialized.current && companyName && !inputCode) {
      setInputCode(companyName);
      initialized.current = true; // 이후로는 재설정하지 않음
    }
  }, [companyName, inputCode, setInputCode]);

  return (
    <form onSubmit={onSearch} style={{ marginBottom: 20 }}>
      <input
        type="text"
        value={inputCode}
        onChange={(e) => setInputCode(e.target.value)}
        placeholder="종목 이름 입력"
        style={{ padding: 8, fontSize: 16, marginRight: 10 }}
      />
      <button type="submit" style={{ padding: "8px 12px" }}>
        검색
      </button>
    </form>
  );
}

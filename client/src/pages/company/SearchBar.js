import React from "react";

export default function SearchBar({ inputCode, setInputCode, onSearch }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <input
        type="text"
        value={inputCode}
        onChange={(e) => setInputCode(e.target.value)}
        placeholder="종목 코드 입력"
        onKeyDown={(e) => e.key === "Enter" && onSearch()}
        style={{ padding: 8, fontSize: 16, marginRight: 10 }}
      />
      <button onClick={onSearch} style={{ padding: "8px 12px" }}>
        검색
      </button>
    </div>
  );
}

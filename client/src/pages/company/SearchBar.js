export default function SearchBar({ inputCode, setInputCode, onSearch }) {
  return (
    <form onSubmit={onSearch} style={{ marginBottom: 20 }}>
      <input
        type="text"
        value={inputCode}
        onChange={(e) => setInputCode(e.target.value)}
        placeholder="종목 코드 또는 이름 입력"
        style={{ padding: 8, fontSize: 16, marginRight: 10 }}
      />
      <button type="submit" style={{ padding: "8px 12px" }}>
        검색
      </button>
    </form>
  );
}

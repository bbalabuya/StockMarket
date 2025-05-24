import { getSignSymbolFromVrss } from "../marketUtils";

export default function StockHeader({
  stockCode,
  stockName, // ★ 추가
  currentPrice,
  priceLabel,
  changeAmount,
  changeRate,
  changeColor,
}) {
  const sign = getSignSymbolFromVrss(changeAmount);
  const displayAmt = `${sign}${Math.abs(
    Number(changeAmount)
  ).toLocaleString()}원`;
  const displayRt = `${parseFloat(changeRate).toFixed(2)}%`;

  return (
    <div style={{ marginBottom: 20, display: "flex", alignItems: "flex-end" }}>
      <div style={{ fontSize: 22, fontWeight: "bold", marginRight: 10 }}>
        {/* 종목코드 + 종목이름 같이 보여주기 */}
        {stockName
          ? `${stockName} (${stockCode})`
          : `종목코드 ${stockCode}`}{" "}
        {currentPrice.toLocaleString()}원 ({priceLabel})
      </div>
      <div style={{ color: changeColor, fontSize: 18, fontWeight: "bold" }}>
        {displayAmt} ({displayRt})
      </div>
    </div>
  );
}

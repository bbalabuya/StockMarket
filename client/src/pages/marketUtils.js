// 장 운영 여부, 부호 기호 함수 모아두기
export const isMarketOpen = () => {
  const now = new Date();
  const h = now.getHours(),
    m = now.getMinutes();
  return (h > 9 || (h === 9 && m >= 0)) && (h < 15 || (h === 15 && m < 30));
};

export const getSignSymbolFromVrss = (vrss) => {
  const v = Number(vrss);
  if (v > 0) return "▲";
  if (v < 0) return "▼";
  return "–";
};

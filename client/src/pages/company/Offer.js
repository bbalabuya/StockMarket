// Offer.js
import React from "react";

export default function Offer({ offer }) {
  if (!offer) {
    return <div>📦 호가 데이터를 불러오는 중...</div>;
  }

  return (
    <div className="mt-5">
      <h3>📊 실시간 호가</h3>
      <table className="w-full border-collapse text-center">
        <thead>
          <tr className="bg-gray-100">
            <th>매도호가</th>
            <th>매수호가</th>
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: 10 }, (_, i) => (
            <tr key={i}>
              <td className="text-red-600">{offer[`askp${i + 1}`] ?? "-"}</td>
              <td className="text-blue-600">{offer[`bidp${i + 1}`] ?? "-"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

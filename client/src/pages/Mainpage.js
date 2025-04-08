import React, { useEffect, useState } from "react";

const Mainpage = () => {
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    const ws = new WebSocket("ws://localhost:8000/ws"); // FastAPI 서버 주소

    ws.onopen = () => {
      console.log("✅ 서버에 연결됨");
    };

    // React Mainpage.jsx
    ws.onmessage = (event) => {
      try {
        // 그냥 문자열로 처리
        setMessages((prev) => [...prev, event.data]);
      } catch (err) {
        console.error("❌ 메시지 수신 오류:", err);
      }
    };

    ws.onclose = () => {
      console.log("🔌 서버 연결 종료");
    };

    return () => {
      ws.close();
    };
  }, []);

  return (
    <div>
      <h1>실시간 체결가 데이터</h1>
      <ul>
        {messages.map((msg, idx) => (
          <li key={idx}>{msg}</li>
        ))}
      </ul>
    </div>
  );
};

export default Mainpage;

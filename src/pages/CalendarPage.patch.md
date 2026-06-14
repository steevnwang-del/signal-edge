在 CalendarPage.jsx 中找到這段並刪除（用戶不應該看到 API 剩餘量）：

刪除：
{remaining !== null && (
  <div style={{ ... }}>
    <span>API 剩餘額度：</span>
    <span>{remaining}</span>
    <span>/500</span>
  </div>
)}

也刪除：
const [remaining, setRemaining] = useState(null);

和：
setRemaining(data.result.remaining);

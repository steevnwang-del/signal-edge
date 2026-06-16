export default function handler(req, res) {
  return res.status(410).json({
    success: false,
    error: '此測試端點已停用。請改用 /api/gateway，body: { source: "aiProvider", action: "diagnose", params: {} }。',
  });
}

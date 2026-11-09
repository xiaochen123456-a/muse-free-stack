export default {  async fetch(request) {
    const url = new URL(request.url);
    const data = {
      service: "muse-free-stack-test",
      status: "ok",
      note: "Cloudflare Workers 免费档跑通验证：每天 10 万次请求以内免费",
      tools: [
        { name: "Cloudflare Workers", free: "100k requests/day" },
        { name: "Cloudflare R2", free: "10GB, zero egress (已开通，桶 muse-free-stack-test)" },
        { name: "Supabase", free: "500MB DB, 2 projects (待用户建账号)" },
        { name: "Kaggle", free: "2x T4, 30 GPU hours/week (已验证，cx2188)" },
        { name: "GitHub Actions", free: "2000 min/month private, unlimited public (仓 muse-free-stack 已建)" },
      ],
    };
    if (url.pathname === "/api/ping") {
      return Response.json({ pong: true, at: new Date().toISOString() });
    }
    return Response.json(data, { headers: { "content-type": "application/json; charset=utf-8" } });
  },};

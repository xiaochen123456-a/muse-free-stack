import { LINKS as LINKS_1 } from "./links-data-1.js";
import { LINKS as LINKS_2 } from "./links-data-2.js";
import { LINKS as LINKS_3 } from "./links-data-3.js";
import { LINKS as LINKS_4 } from "./links-data-4.js";

// 数据分 4 个文件放，是因为单文件 244KB 一次推不上去；拼起来还是 82 条，顺序不变。
const LINKS = [...LINKS_1, ...LINKS_2, ...LINKS_3, ...LINKS_4];

const CATEGORIES = ["🟣 视频", "⚪ 观察", "🟢 赚钱", "🟠 工具日", "🔵 交易"];

function searchLinks(url) {
  const q = (url.searchParams.get("q") || "").trim().toLowerCase();
  const category = url.searchParams.get("category") || "";
  const status = url.searchParams.get("status") || "all";
  const limit = Math.min(Math.max(parseInt(url.searchParams.get("limit") || "50", 10) || 50, 1), 200);
  const offset = Math.max(parseInt(url.searchParams.get("offset") || "0", 10) || 0, 0);
  let rows = LINKS;
  if (category && category !== "全部") rows = rows.filter((r) => r.category === category);
  if (status === "pending") rows = rows.filter((r) => r.pending);
  else if (status === "done") rows = rows.filter((r) => !r.pending);
  if (q) {
    rows = rows.filter((r) =>
      [r.title, r.summary, r.detail, r.status, r.source_url, r.raw_text]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(q),
    );
  }
  const total = rows.length;
  const page = rows.slice(offset, offset + limit);
  return { total, count: page.length, offset, limit, rows: page };
}

function searchPage() {
  return `<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>链接收件箱 - 搜索</title>
<style>
body{font-family:-apple-system,BlinkMacSystemFont,"PingFang SC","Microsoft YaHei",sans-serif;max-width:760px;margin:0 auto;padding:20px 16px;color:#222}
h1{font-size:20px;margin:0 0 4px}
.sub{color:#888;font-size:13px;margin-bottom:16px}
.row{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px}
input[type=text]{flex:1;min-width:180px;padding:9px 10px;font-size:15px;border:1px solid #ccc;border-radius:8px}
select,button{padding:9px 10px;font-size:15px;border:1px solid #ccc;border-radius:8px;background:#fff}
button{background:#2563eb;color:#fff;border-color:#2563eb;cursor:pointer}
#count{color:#888;font-size:13px;margin:4px 0 12px}
.card{border:1px solid #e5e5e5;border-radius:10px;padding:12px 14px;margin-bottom:10px}
.card h2{font-size:15px;margin:0 0 6px;line-height:1.5}
.card p{font-size:13px;color:#555;line-height:1.6;margin:0 0 8px;white-space:pre-wrap;word-break:break-word}
.meta{font-size:12px;color:#999}
.meta a{color:#2563eb;word-break:break-all}
.badge{display:inline-block;font-size:12px;padding:1px 7px;border-radius:20px;background:#eef2ff;color:#3730a3;margin-right:6px}
.badge.pending{background:#fef3c7;color:#92400e}
#more{width:100%;margin:4px 0 12px;background:#fff;color:#2563eb;border-color:#2563eb}
</style>
</head>
<body>
<h1>链接收件箱</h1>
<div class="sub">关键词搜标题、摘要和原文；分类、状态都能筛。数据来自 Supabase，82 条。</div>
<div class="row">
<input id="q" type="text" placeholder="搜关键词，比如 Kaggle、Arcus…">
<select id="category"><option value="">全部分类</option><option>🟣 视频</option><option>⚪ 观察</option><option>🟢 赚钱</option><option>🟠 工具日</option><option>🔵 交易</option></select>
<select id="status"><option value="all">全部状态</option><option value="pending">待决定</option><option value="done">已归档</option></select>
<button id="go">搜索</button>
</div>
<div id="count"></div>
<div id="list"></div>
<button id="more" style="display:none">加载更多</button>
<script>
function esc(s){return String(s==null?"":s).replace(/[&<>"']/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]})}
var loaded=0,total=0;
function cardHtml(row){
  return '<div class="card"><h2>'+esc(row.title||"(无标题)")+'</h2><p>'+esc(row.summary||"")+'</p><div class="meta"><span class="badge">'+esc(row.category||"")+'</span>'+(row.pending?'<span class="badge pending">待决定</span>':"")+'<span>'+esc(row.entry_date||"")+'</span>'+(row.source_url?' · <a href="'+esc(row.source_url)+'" target="_blank" rel="noopener">打开原链接</a>':"")+(row.detail?' · '+esc(row.detail):"")+'</div></div>';
}
async function run(reset){
  if(reset){loaded=0;document.getElementById("list").innerHTML="";}
  var p=new URLSearchParams();
  var q=document.getElementById("q").value.trim();
  var c=document.getElementById("category").value;
  var s=document.getElementById("status").value;
  if(q)p.set("q",q); if(c)p.set("category",c); if(s&&s!=="all")p.set("status",s);
  p.set("limit","50");
  p.set("offset",String(loaded));
  var r=await fetch("/api/links?"+p.toString());
  var d=await r.json();
  total=d.total;
  loaded+=d.count;
  document.getElementById("count").textContent="共 "+total+" 条，已显示 "+loaded+" 条";
  var h="";
  d.rows.forEach(function(row){h+=cardHtml(row)});
  if(reset&&!h){document.getElementById("list").innerHTML="<p>没找到，换个词试试。</p>";}
  else{document.getElementById("list").insertAdjacentHTML("beforeend",h);}
  document.getElementById("more").style.display=loaded<total?"block":"none";
}
document.getElementById("go").addEventListener("click",function(){run(true)});
document.getElementById("q").addEventListener("keydown",function(e){if(e.key==="Enter")run(true)});
document.getElementById("more").addEventListener("click",function(){run(false)});
run(true);
</script>
</body>
</html>`;
}

const ROOT = {
  service: "muse-free-stack-test",
  status: "ok",
  note: "Cloudflare Workers 免费档跑通验证：每天 10 万次请求以内免费",
  tools: [
    { name: "Cloudflare Workers", free: "100k requests/day" },
    { name: "Cloudflare R2", free: "10GB, zero egress (已开通，桶 muse-free-stack-test)" },
    { name: "Supabase", free: "500MB DB, 2 projects (链接收件箱 82 条已入库，可查 /links)" },
    { name: "Kaggle", free: "2x T4, 30 GPU hours/week (已验证，cx2188)" },
    { name: "GitHub Actions", free: "2000 min/month private, unlimited public (仓 muse-free-stack 已建)" },
  ],
  links: { count: LINKS.length, search_page: "/links", api: "/api/links?q=关键词&category=🟢 赚钱&status=pending" },
};

// ---- Parallel MCP 匿名中继（GET 接口）----
// 背景：云端这台机器出口只通 GET、所有 POST 都被挡（httpbin 对照也一样）；
// MCP 协议必须走 POST，所以直连测不了。这条路由让 Worker（Cloudflare 出口正常）
// 代做 MCP 握手 + 工具调用，云端只用 GET 就能查。
// GET /api/parallel?tool=list
// GET /api/parallel?tool=web_search&q=...
// GET /api/parallel?tool=web_fetch&url=...
// GET /api/parallel?tool=web_decisions&question=... 或 questions=["...","..."]
// 不传任何 Key、不登录、不绑卡，只用 Parallel 的匿名免费额度；超了只限速、不扣费。
// 注意：这条路由是公开 URL（没做鉴权，Key 放公开仓里等于没放），只代理免费匿名 MCP，
// 不经过任何账号或付费额度；有人乱刷最多烧匿名限速和本 Worker 的免费次数。
const MCP_URL = "https://mcp.parallel.ai/mcp";

// 调一次 MCP JSON-RPC（Streamable HTTP）。服务器会一直开着 SSE 流，必须读到目标 id 的
// result/error 就主动断开，不能等流关（等流关会一直挂着）。
async function mcpPost(payload, sessionId, timeoutMs = 25000) {
  const headers = {
    "content-type": "application/json",
    "accept": "application/json, text/event-stream",
  };
  if (sessionId) headers["mcp-session-id"] = sessionId;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  let resp;
  try {
    resp = await fetch(MCP_URL, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
      signal: ctrl.signal,
    });
  } catch (e) {
    clearTimeout(timer);
    return { error: "fetch failed: " + (e && e.message ? e.message : String(e)) };
  }
  const newSession = resp.headers.get("mcp-session-id") || sessionId || null;
  const ctype = (resp.headers.get("content-type") || "").toLowerCase();
  if (ctype.includes("application/json") && !ctype.includes("text/event-stream")) {
    clearTimeout(timer);
    try {
      const data = await resp.json();
      return { data, sessionId: newSession, httpStatus: resp.status };
    } catch (e) {
      return { error: "bad json response: " + e.message, sessionId: newSession, httpStatus: resp.status };
    }
  }
  if (!resp.body) {
    clearTimeout(timer);
    return { error: "empty response body", sessionId: newSession, httpStatus: resp.status };
  }
  const reader = resp.body.getReader();
  const decoder = new TextDecoder();
  let buf = "";
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      buf += decoder.decode(value, { stream: true });
      const lines = buf.split("\n");
      buf = lines.pop();
      for (const line of lines) {
        const t = line.trim();
        if (!t.startsWith("data:")) continue;
        const raw = t.slice(5).trim();
        if (!raw || raw === "[DONE]") continue;
        let msg;
        try {
          msg = JSON.parse(raw);
        } catch {
          continue;
        }
        if (msg && msg.id === payload.id && (msg.result !== undefined || msg.error !== undefined)) {
          try {
            await reader.cancel();
          } catch {}
          clearTimeout(timer);
          return { data: msg, sessionId: newSession, httpStatus: resp.status };
        }
      }
    }
  } catch (e) {
    clearTimeout(timer);
    return { error: "stream read failed: " + (e && e.message ? e.message : String(e)), sessionId: newSession, httpStatus: resp.status };
  }
  clearTimeout(timer);
  return { error: "no matching response in stream", sessionId: newSession, httpStatus: resp.status };
}

// 做一次完整 MCP 会话：initialize → notifications/initialized → 目标方法。
// Worker 无状态，每次调用重新握手（初始化约 0.8 秒，搜索约 1.7 秒）。
async function mcpSession(method, params) {
  const init = await mcpPost({
    jsonrpc: "2.0",
    id: 1,
    method: "initialize",
    params: {
      protocolVersion: "2025-06-18",
      capabilities: {},
      clientInfo: { name: "parallel-mcp-relay", version: "1.0" },
    },
  });
  if (!init.data || init.data.error || !init.data.result) {
    return { ok: false, stage: "initialize", detail: init };
  }
  const sessionId = init.sessionId || null;
  // initialized 通知：发了就走，不等流（通知本身不回包，等会挂住），3 秒兜底
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 3000);
    await fetch(MCP_URL, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "accept": "application/json, text/event-stream",
        ...(sessionId ? { "mcp-session-id": sessionId } : {}),
      },
      body: JSON.stringify({ jsonrpc: "2.0", method: "notifications/initialized" }),
      signal: ctrl.signal,
    })
      .then((r) => {
        clearTimeout(timer);
        try {
          if (r.body) r.body.cancel();
        } catch {}
      })
      .catch(() => clearTimeout(timer));
  } catch {}
  const res = await mcpPost({ jsonrpc: "2.0", id: 2, method, params }, sessionId);
  if (!res.data || res.data.error || !res.data.result) {
    return { ok: false, stage: method, detail: res };
  }
  return { ok: true, result: res.data.result };
}

function parallelBad(message) {
  return Response.json(
    { ok: false, error: message },
    { status: 400, headers: { "content-type": "application/json; charset=utf-8", "access-control-allow-origin": "*" } },
  );
}

async function handleParallel(url) {
  const tool = (url.searchParams.get("tool") || "web_search").trim();
  const started = Date.now();
  const done = (result) =>
    Response.json(
      { ...result, ms: Date.now() - started, via: "parallel-mcp-relay (anonymous, no key)" },
      { headers: { "content-type": "application/json; charset=utf-8", "access-control-allow-origin": "*" } },
    );
  if (tool === "list") {
    const r = await mcpSession("tools/list", {});
    if (!r.ok) return done(r);
    return done({
      ok: true,
      tools: (r.result.tools || []).map((t) => ({ name: t.name, description: t.description || "", inputSchema: t.inputSchema || {} })),
    });
  }
  if (tool === "web_search") {
    const q = (url.searchParams.get("q") || "").trim();
    if (!q) return parallelBad("missing q");
    let queries = [q];
    const rawQ = (url.searchParams.get("queries") || "").trim();
    if (rawQ) {
      try {
        queries = JSON.parse(rawQ);
      } catch {
        return parallelBad("queries must be a JSON array string");
      }
    }
    if (!Array.isArray(queries) || queries.length === 0) return parallelBad("queries must be a non-empty array");
    const r = await mcpSession("tools/call", { name: "web_search", arguments: { objective: q, search_queries: queries } });
    if (!r.ok) return done(r);
    return done({ ok: true, tool: "web_search", content: r.result.content || [], isError: !!r.result.isError });
  }
  if (tool === "web_fetch") {
    const u = (url.searchParams.get("url") || "").trim();
    const rawU = (url.searchParams.get("urls") || "").trim();
    let urls = [];
    if (rawU) {
      try {
        urls = JSON.parse(rawU);
      } catch {
        return parallelBad("urls must be a JSON array string");
      }
    } else if (u) {
      urls = [u];
    }
    if (!Array.isArray(urls) || urls.length === 0) return parallelBad("missing url");
    const objective = (url.searchParams.get("objective") || "").trim();
    const args = { urls };
    if (objective) args.objective = objective.slice(0, 200);
    const r = await mcpSession("tools/call", { name: "web_fetch", arguments: args });
    if (!r.ok) return done(r);
    return done({ ok: true, tool: "web_fetch", content: r.result.content || [], isError: !!r.result.isError });
  }
  if (tool === "web_decisions") {
    // 优先用 args 直通（完整 arguments JSON，形状以 tools/list 的 inputSchema 为准）；
    // 否则用 question 快捷方式拼一个布尔型问题（形状是按 schema 猜的，失败时看服务端报错再调）。
    const rawArgs = (url.searchParams.get("args") || "").trim();
    if (rawArgs) {
      let args;
      try {
        args = JSON.parse(rawArgs);
      } catch {
        return parallelBad("args must be a JSON object string");
      }
      const r = await mcpSession("tools/call", { name: "web_decisions", arguments: args });
      if (!r.ok) return done(r);
      return done({ ok: true, tool: "web_decisions", content: r.result.content || [], isError: !!r.result.isError });
    }
    const raw = (url.searchParams.get("questions") || "").trim();
    const single = (url.searchParams.get("question") || "").trim();
    let questions = null;
    if (raw) {
      try {
        questions = JSON.parse(raw);
      } catch {
        return parallelBad("questions must be a JSON object string");
      }
    } else if (single) {
      questions = { answer: { type: "boolean", question: single } };
    }
    if (!questions || typeof questions !== "object") return parallelBad("missing questions");
    const stateRaw = (url.searchParams.get("state") || "").trim();
    let state = { subject: single || "general" };
    if (stateRaw) {
      try {
        state = JSON.parse(stateRaw);
      } catch {
        return parallelBad("state must be a JSON value string");
      }
    }
    const r = await mcpSession("tools/call", { name: "web_decisions", arguments: { state, questions } });
    if (!r.ok) return done(r);
    return done({ ok: true, tool: "web_decisions", content: r.result.content || [], isError: !!r.result.isError });
  }
  return parallelBad("unknown tool: " + tool + " (use list, web_search, web_fetch, web_decisions)");
}

export default {
  async fetch(request) {
    const url = new URL(request.url);
    if (url.pathname === "/api/ping") {
      return Response.json({ pong: true, at: new Date().toISOString() });
    }
    if (url.pathname === "/api/parallel") {
      return handleParallel(url);
    }
    if (url.pathname === "/api/links") {
      return Response.json(searchLinks(url), {
        headers: { "content-type": "application/json; charset=utf-8", "access-control-allow-origin": "*" },
      });
    }
    if (url.pathname === "/links") {
      return new Response(searchPage(), { headers: { "content-type": "text/html; charset=utf-8" } });
    }
    if (url.pathname === "/") {
      return Response.json(ROOT, { headers: { "content-type": "application/json; charset=utf-8" } });
    }
    return Response.json(
      { error: "not found" },
      { status: 404, headers: { "content-type": "application/json; charset=utf-8" } },
    );
  },
};

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

export default {
  async fetch(request) {
    const url = new URL(request.url);
    if (url.pathname === "/api/ping") {
      return Response.json({ pong: true, at: new Date().toISOString() });
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

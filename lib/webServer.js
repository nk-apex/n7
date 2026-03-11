import http from 'http';
import { getPlatformInfo } from './platformDetect.js';

let _server = null;

function getStatus() {
  const s = globalThis._webStatus || {};
  const uptime = process.uptime();
  const h = Math.floor(uptime / 3600);
  const m = Math.floor((uptime % 3600) / 60);
  const sec = Math.floor(uptime % 60);
  const uptimeStr = `${h}h ${m}m ${sec}s`;

  const platform = getPlatformInfo();

  return {
    botName:    s.botName    || global.BOT_NAME || 'WOLFBOT',
    version:    s.version    || global.VERSION  || '1.0.0',
    connected:  s.connected  ?? false,
    uptime:     uptimeStr,
    uptimeSecs: Math.floor(uptime),
    platform:   `${platform.icon} ${platform.name}`,
    commands:   s.commands   || 0,
    prefix:     s.prefix     || '.',
    botMode:    s.botMode    || 'public',
    owner:      s.owner      || 'Unknown',
    antispam:   s.antispam   ?? false,
    antibug:    s.antibug    ?? false,
    antilink:   s.antilink   ?? false,
    timestamp:  new Date().toISOString(),
  };
}

function getPort() {
  if (process.env.PORT)        return parseInt(process.env.PORT);
  if (process.env.SERVER_PORT) return parseInt(process.env.SERVER_PORT);
  if (process.env.APP_PORT)    return parseInt(process.env.APP_PORT);
  return 3000;
}

function getHTML(st) {
  const online      = st.connected;
  const statusLabel = online ? 'ONLINE' : 'OFFLINE';

  const pillStyle = online
    ? ''
    : 'style="background:hsla(0,84%,60%,.06);color:hsl(0,84%,60%);border-color:hsl(0,84%,60%);text-shadow:0 0 8px hsl(0,84%,60%);box-shadow:0 0 14px hsla(0,84%,60%,.3),inset 0 0 14px hsla(0,84%,60%,.05)"';

  const dotStyle = online
    ? ''
    : 'style="background:hsl(0,84%,60%);box-shadow:0 0 6px hsl(0,84%,60%),0 0 14px hsl(0,84%,60%);animation:none"';

  function badge(val, label) {
    const cls = val ? 'badge-on' : 'badge-off';
    const txt = val ? 'ON' : 'OFF';
    return `<span class="badge ${cls}">${label} <b>${txt}</b></span>`;
  }

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<meta http-equiv="refresh" content="30"/>
<title>${st.botName} — Status</title>
<link rel="preconnect" href="https://fonts.googleapis.com"/>
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin/>
<link href="https://fonts.googleapis.com/css2?family=Orbitron:wght@700;900&family=JetBrains+Mono:wght@400;500;700&display=swap" rel="stylesheet"/>
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  :root{
    --bg:hsl(120,100%,2%);
    --surface:hsl(120,100%,3%);
    --card:hsl(120,100%,4%);
    --neon:hsl(120,100%,50%);
    --neon-dim:hsl(120,80%,30%);
    --border:hsl(120,100%,20%);
    --border-faint:hsla(120,100%,50%,.15);
    --text:hsl(120,100%,50%);
    --muted:hsl(120,50%,40%);
    --warn:hsl(0,84%,60%);
    --radius:.75rem;
    --font-mono:'JetBrains Mono',monospace;
    --font-head:'Orbitron',sans-serif
  }
  html{
    scrollbar-color:var(--neon-dim) var(--bg);
    scrollbar-width:thin
  }
  ::-webkit-scrollbar{width:6px}
  ::-webkit-scrollbar-track{background:hsl(120,100%,3%)}
  ::-webkit-scrollbar-thumb{background:hsl(120,100%,20%);border-radius:4px}
  ::-webkit-scrollbar-thumb:hover{background:hsl(120,100%,30%)}

  body{
    background-color:var(--bg);
    background-image:
      linear-gradient(0deg,transparent 24%,hsla(120,100%,50%,.025) 25%,hsla(120,100%,50%,.025) 26%,transparent 27%,transparent 74%,hsla(120,100%,50%,.025) 75%,hsla(120,100%,50%,.025) 76%,transparent 77%),
      linear-gradient(90deg,transparent 24%,hsla(120,100%,50%,.025) 25%,hsla(120,100%,50%,.025) 26%,transparent 27%,transparent 74%,hsla(120,100%,50%,.025) 75%,hsla(120,100%,50%,.025) 76%,transparent 77%);
    background-size:40px 40px;
    color:var(--text);
    font-family:var(--font-mono);
    min-height:100vh;
    display:flex;flex-direction:column;align-items:center;
    padding:40px 16px 32px
  }

  /* HEADER */
  header{
    text-align:center;margin-bottom:40px;
    position:relative;width:100%;max-width:740px
  }
  .scan-line{
    position:absolute;left:0;right:0;height:2px;top:0;
    background:linear-gradient(90deg,transparent,var(--neon),transparent);
    opacity:.35;
    animation:scan 4s linear infinite
  }
  @keyframes scan{0%{top:-5%}100%{top:115%}}

  .wolf-icon{
    font-size:52px;line-height:1;margin-bottom:12px;
    filter:drop-shadow(0 0 12px var(--neon)) drop-shadow(0 0 28px hsla(120,100%,50%,.5))
  }
  h1{
    font-family:var(--font-head);font-size:30px;font-weight:900;
    letter-spacing:6px;text-transform:uppercase;color:#fff;
    text-shadow:0 0 8px var(--neon),0 0 20px var(--neon),0 0 50px hsla(120,100%,50%,.4)
  }
  .ver{
    font-size:11px;letter-spacing:3px;color:var(--muted);margin-top:6px;
    font-family:var(--font-mono)
  }
  .status-pill{
    display:inline-flex;align-items:center;gap:10px;
    padding:7px 20px;margin-top:14px;
    border-radius:.5rem;
    font-size:12px;font-weight:700;letter-spacing:2px;
    font-family:var(--font-mono);text-transform:uppercase;
    background:hsla(120,100%,50%,.06);
    color:var(--neon);
    border:1px solid var(--neon);
    box-shadow:0 0 14px hsla(120,100%,50%,.3),inset 0 0 14px hsla(120,100%,50%,.05);
    text-shadow:0 0 8px var(--neon)
  }
  .dot{
    width:9px;height:9px;border-radius:50%;
    background:var(--neon);
    box-shadow:0 0 6px var(--neon),0 0 14px var(--neon);
    animation:pulse-dot 1.6s ease-in-out infinite
  }
  @keyframes pulse-dot{
    0%,100%{opacity:1;box-shadow:0 0 6px var(--neon),0 0 14px var(--neon)}
    50%{opacity:.3;box-shadow:none}
  }

  /* CARDS */
  .grid{
    display:grid;
    grid-template-columns:repeat(auto-fit,minmax(200px,1fr));
    gap:12px;width:100%;max-width:740px;margin-bottom:16px
  }
  .card{
    position:relative;overflow:hidden;
    background:hsla(120,100%,50%,.03);
    border:1px solid var(--border-faint);
    border-radius:var(--radius);
    padding:18px 20px;
    backdrop-filter:blur(12px);
    box-shadow:0 0 18px hsla(120,100%,50%,.08),inset 0 0 18px hsla(120,100%,50%,.02);
    transition:border-color .2s,box-shadow .2s
  }
  .card::before{
    content:'';position:absolute;top:0;left:0;right:0;height:1px;
    background:linear-gradient(90deg,transparent,hsla(120,100%,50%,.5),transparent)
  }
  .card:hover{
    border-color:hsla(120,100%,50%,.35);
    box-shadow:0 0 28px hsla(120,100%,50%,.18),inset 0 0 28px hsla(120,100%,50%,.03)
  }
  .card-label{
    font-size:10px;text-transform:uppercase;letter-spacing:2px;
    color:var(--muted);margin-bottom:10px;font-family:var(--font-mono)
  }
  .card-value{
    font-size:22px;font-weight:700;color:#fff;word-break:break-word;
    text-shadow:0 0 10px hsla(120,100%,50%,.4);font-family:var(--font-mono)
  }
  .card-value.neon{
    color:var(--neon);
    text-shadow:0 0 6px var(--neon),0 0 14px var(--neon),0 0 28px hsla(120,100%,50%,.3)
  }
  .card-value.uptime{font-size:16px;color:#a3ffcc;font-variant-numeric:tabular-nums}
  .card-value.dim{font-size:13px;color:var(--muted)}

  /* BADGES */
  .badges{
    display:flex;flex-wrap:wrap;gap:8px;
    width:100%;max-width:740px;margin-bottom:16px
  }
  .badge{
    font-size:11px;font-weight:600;padding:5px 14px;
    border-radius:.5rem;letter-spacing:1.5px;text-transform:uppercase;
    font-family:var(--font-mono)
  }
  .badge-on{
    background:hsla(120,100%,50%,.08);
    color:var(--neon);border:1px solid hsla(120,100%,50%,.35);
    text-shadow:0 0 6px var(--neon)
  }
  .badge-off{
    background:hsla(120,100%,50%,.02);
    color:hsl(120,20%,30%);border:1px solid hsl(120,20%,15%)
  }

  /* PLATFORM */
  .platform-card{
    position:relative;overflow:hidden;
    background:hsla(120,100%,50%,.03);
    border:1px solid var(--border-faint);
    border-radius:var(--radius);
    padding:16px 24px;
    width:100%;max-width:740px;
    text-align:center;margin-bottom:20px;
    backdrop-filter:blur(12px);
    box-shadow:0 0 18px hsla(120,100%,50%,.08)
  }
  .platform-card::before{
    content:'';position:absolute;top:0;left:0;right:0;height:1px;
    background:linear-gradient(90deg,transparent,hsla(120,100%,50%,.5),transparent)
  }
  .p-label{
    font-size:10px;text-transform:uppercase;letter-spacing:2px;
    color:var(--muted);margin-bottom:6px;font-family:var(--font-mono)
  }
  .plat{
    font-size:15px;font-weight:700;color:var(--neon);letter-spacing:1px;
    text-shadow:0 0 8px var(--neon),0 0 18px hsla(120,100%,50%,.3);
    font-family:var(--font-mono)
  }

  /* LINKS */
  .links{
    display:flex;gap:12px;flex-wrap:wrap;
    justify-content:center;margin-bottom:32px
  }
  a.btn{
    padding:11px 24px;border-radius:.75rem;
    font-size:11px;font-weight:700;letter-spacing:2px;
    text-transform:uppercase;text-decoration:none;
    font-family:var(--font-head);
    transition:all .2s
  }
  a.btn-primary{
    background:transparent;color:var(--neon);
    border:2px solid var(--neon);
    box-shadow:0 0 12px hsla(120,100%,50%,.3),inset 0 0 12px hsla(120,100%,50%,.05);
    text-shadow:0 0 8px var(--neon)
  }
  a.btn-primary:hover{
    background:hsla(120,100%,50%,.1);
    box-shadow:0 0 24px hsla(120,100%,50%,.5),inset 0 0 20px hsla(120,100%,50%,.1);
    transform:scale(1.02)
  }
  a.btn-ghost{
    background:transparent;color:hsl(120,60%,70%);
    border:2px solid hsl(120,40%,25%);
    box-shadow:0 0 10px hsla(120,100%,50%,.1)
  }
  a.btn-ghost:hover{
    border-color:hsl(120,60%,40%);color:var(--neon);
    box-shadow:0 0 18px hsla(120,100%,50%,.25);
    transform:scale(1.02)
  }

  /* FOOTER */
  footer{
    font-size:11px;color:var(--muted);text-align:center;
    letter-spacing:1.5px;text-transform:uppercase;font-family:var(--font-mono)
  }
  footer span{
    color:var(--neon);font-weight:700;
    text-shadow:0 0 8px var(--neon)
  }

  @media(max-width:480px){
    h1{font-size:22px;letter-spacing:3px}
    .card-value{font-size:17px}
    .grid{grid-template-columns:1fr 1fr}
  }
</style>
</head>
<body>

<header>
  <div class="scan-line"></div>
  <div class="wolf-icon">🐺</div>
  <h1>${st.botName}</h1>
  <div class="ver">v${st.version} // STATUS TERMINAL</div>
  <div class="status-pill" ${pillStyle}><div class="dot" ${dotStyle}></div>${statusLabel}</div>
</header>

<div class="grid">
  <div class="card">
    <div class="card-label">// UPTIME</div>
    <div class="card-value uptime">${st.uptime}</div>
  </div>
  <div class="card">
    <div class="card-label">// COMMANDS</div>
    <div class="card-value neon">${st.commands}</div>
  </div>
  <div class="card">
    <div class="card-label">// PREFIX</div>
    <div class="card-value neon">${st.prefix === 'none' ? '(none)' : st.prefix}</div>
  </div>
  <div class="card">
    <div class="card-label">// MODE</div>
    <div class="card-value neon">${st.botMode.toUpperCase()}</div>
  </div>
  <div class="card">
    <div class="card-label">// OWNER</div>
    <div class="card-value" style="font-size:14px;color:#a3ffcc">+${st.owner}</div>
  </div>
  <div class="card">
    <div class="card-label">// LAST PING</div>
    <div class="card-value dim">${new Date().toLocaleTimeString()}</div>
  </div>
</div>

<div class="badges">
  ${badge(st.antispam, 'ANTI-SPAM')}
  ${badge(st.antibug,  'ANTI-BUG')}
  ${badge(st.antilink, 'ANTI-LINK')}
</div>

<div class="platform-card">
  <div class="p-label">// RUNTIME ENVIRONMENT</div>
  <div class="plat">${st.platform}</div>
</div>

<div class="links">
  <a class="btn btn-primary" href="/api/status">[ JSON STATUS ]</a>
  <a class="btn btn-ghost" href="/health">[ HEALTH CHECK ]</a>
</div>

<footer>
  POWERED BY <span>WOLF TECH</span> &nbsp;//&nbsp; AUTO-REFRESH 30s
</footer>

</body>
</html>`;
}

export function setupWebServer() {
  if (_server) return;

  const PORT = getPort();

  _server = http.createServer((req, res) => {
    const url = req.url.split('?')[0];
    const st  = getStatus();

    if (url === '/health') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ status: 'ok', connected: st.connected, uptime: st.uptimeSecs, timestamp: st.timestamp }));
    }

    if (url === '/api/status') {
      res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
      return res.end(JSON.stringify(st, null, 2));
    }

    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(getHTML(st));
  });

  _server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.log(`[WebServer] Port ${PORT} in use, trying ${PORT + 1}`);
      _server.listen(PORT + 1, '0.0.0.0');
    }
  });

  _server.listen(PORT, '0.0.0.0', () => {
    const { name } = getPlatformInfo();
    console.log(`[WebServer] 🌐 Status page running on port ${PORT} (${name})`);
  });
}

export function updateWebStatus(data) {
  globalThis._webStatus = { ...(globalThis._webStatus || {}), ...data };
}

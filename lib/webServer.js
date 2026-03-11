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
  if (process.env.PORT)            return parseInt(process.env.PORT);
  if (process.env.SERVER_PORT)     return parseInt(process.env.SERVER_PORT);
  if (process.env.APP_PORT)        return parseInt(process.env.APP_PORT);
  return 3000;
}

function getHTML(st) {
  const online       = st.connected;
  const statusColor  = online ? '#00ff88' : '#ff3c3c';
  const statusLabel  = online ? 'ONLINE' : 'OFFLINE';
  const modeColor    = st.botMode === 'private' ? '#bf5fff' : st.botMode === 'group' ? '#00cfff' : '#00ff88';

  function badge(val, label) {
    const c = val ? '#00ff88' : '#444';
    const tc = val ? '#00ff88' : '#666';
    const txt = val ? 'ON' : 'OFF';
    return `<span class="badge" style="background:${c}18;color:${tc};border:1px solid ${c}55">${label} <b>${txt}</b></span>`;
  }

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<meta http-equiv="refresh" content="30"/>
<title>${st.botName} — Status</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Share+Tech+Mono&family=Orbitron:wght@700;900&display=swap');
  *{margin:0;padding:0;box-sizing:border-box}
  :root{
    --bg:#020c06;--surface:#050f08;--card:#07140a;
    --neon:#00ff88;--neon2:#00cfff;--warn:#ff3c3c;
    --border:#00ff8830;--text:#b0ffcc;--muted:#3a6b4a;
    --font-mono:'Share Tech Mono',monospace;
    --font-head:'Orbitron',sans-serif
  }
  html{scrollbar-color:var(--neon) var(--bg);scrollbar-width:thin}
  body{
    background:var(--bg);
    background-image:
      linear-gradient(0deg,transparent 24%,#00ff8806 25%,#00ff8806 26%,transparent 27%,transparent 74%,#00ff8806 75%,#00ff8806 76%,transparent 77%),
      linear-gradient(90deg,transparent 24%,#00ff8806 25%,#00ff8806 26%,transparent 27%,transparent 74%,#00ff8806 75%,#00ff8806 76%,transparent 77%);
    background-size:40px 40px;
    color:var(--text);font-family:var(--font-mono);
    min-height:100vh;display:flex;flex-direction:column;align-items:center;padding:32px 16px
  }
  header{text-align:center;margin-bottom:36px;position:relative}
  .wolf{font-size:56px;line-height:1;margin-bottom:10px;
        filter:drop-shadow(0 0 16px #00ff88) drop-shadow(0 0 32px #00ff8880)}
  h1{
    font-family:var(--font-head);font-size:32px;font-weight:900;
    letter-spacing:4px;text-transform:uppercase;
    color:#fff;
    text-shadow:0 0 10px var(--neon),0 0 30px var(--neon),0 0 60px #00ff8866;
  }
  .ver{
    font-size:12px;letter-spacing:3px;color:var(--neon);margin-top:6px;
    text-shadow:0 0 8px var(--neon)
  }
  .status-pill{
    display:inline-flex;align-items:center;gap:10px;padding:8px 22px;
    border-radius:3px;font-size:13px;font-weight:700;letter-spacing:2px;margin-top:16px;
    background:${statusColor}12;color:${statusColor};
    border:1px solid ${statusColor};
    text-shadow:0 0 8px ${statusColor};
    box-shadow:0 0 16px ${statusColor}40,inset 0 0 16px ${statusColor}08
  }
  .dot{
    width:10px;height:10px;border-radius:50%;background:${statusColor};
    box-shadow:0 0 6px ${statusColor},0 0 12px ${statusColor};
    animation:${online ? 'blink 1.4s ease-in-out infinite' : 'none'}
  }
  @keyframes blink{0%,100%{opacity:1;box-shadow:0 0 6px ${statusColor},0 0 18px ${statusColor}}50%{opacity:.3;box-shadow:none}}
  .scan{
    position:absolute;top:0;left:-10%;width:120%;height:2px;
    background:linear-gradient(90deg,transparent,var(--neon),transparent);
    animation:scan 3s linear infinite;opacity:.4
  }
  @keyframes scan{0%{top:-5%}100%{top:110%}}
  .grid{
    display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));
    gap:12px;width:100%;max-width:740px;margin-bottom:18px
  }
  .card{
    background:var(--card);
    border:1px solid var(--border);
    border-top:1px solid var(--neon)44;
    border-radius:3px;padding:16px 18px;
    position:relative;overflow:hidden;
    transition:border-color .2s,box-shadow .2s
  }
  .card::before{
    content:'';position:absolute;top:0;left:0;right:0;height:1px;
    background:linear-gradient(90deg,transparent,var(--neon)88,transparent)
  }
  .card:hover{border-color:var(--neon)66;box-shadow:0 0 20px var(--neon)18}
  .card-label{
    font-size:10px;text-transform:uppercase;letter-spacing:1.5px;
    color:var(--muted);margin-bottom:8px
  }
  .card-value{font-size:20px;font-weight:700;color:#fff;word-break:break-word;
              text-shadow:0 0 10px var(--neon)66}
  .card-value.accent{color:var(--neon);text-shadow:0 0 10px var(--neon)}
  .card-value.mode{color:${modeColor};text-shadow:0 0 10px ${modeColor}}
  .card-value.uptime{font-size:15px;color:#a3ffcb;font-variant-numeric:tabular-nums}
  .card-value.dim{font-size:13px;color:var(--muted)}
  .badges{display:flex;flex-wrap:wrap;gap:8px;width:100%;max-width:740px;margin-bottom:18px}
  .badge{font-size:11px;font-weight:600;padding:5px 14px;border-radius:3px;letter-spacing:1px}
  .platform-card{
    background:var(--card);border:1px solid var(--border);
    border-radius:3px;padding:14px 20px;
    width:100%;max-width:740px;text-align:center;margin-bottom:18px;
    position:relative;overflow:hidden
  }
  .platform-card::before{
    content:'';position:absolute;top:0;left:0;right:0;height:1px;
    background:linear-gradient(90deg,transparent,var(--neon2)88,transparent)
  }
  .platform-card .p-label{font-size:10px;text-transform:uppercase;letter-spacing:1.5px;color:var(--muted);margin-bottom:4px}
  .platform-card .plat{font-size:15px;font-weight:700;color:var(--neon2);letter-spacing:1px;
                       text-shadow:0 0 10px var(--neon2)}
  .links{display:flex;gap:12px;flex-wrap:wrap;justify-content:center;margin-bottom:28px}
  a.btn{
    padding:10px 22px;border-radius:3px;font-size:12px;font-weight:700;
    letter-spacing:1.5px;text-transform:uppercase;text-decoration:none;
    font-family:var(--font-mono);transition:.2s
  }
  a.btn-primary{
    background:transparent;color:var(--neon);
    border:1px solid var(--neon);
    box-shadow:0 0 12px var(--neon)40,inset 0 0 12px var(--neon)08;
    text-shadow:0 0 8px var(--neon)
  }
  a.btn-ghost{
    background:transparent;color:var(--neon2);
    border:1px solid var(--neon2)66;
    box-shadow:0 0 10px var(--neon2)20
  }
  a.btn:hover{filter:brightness(1.25);box-shadow:0 0 20px currentColor}
  footer{font-size:11px;color:var(--muted);text-align:center;letter-spacing:1px}
  footer span{color:var(--neon);font-weight:700;text-shadow:0 0 8px var(--neon)}
  @media(max-width:480px){h1{font-size:24px;letter-spacing:2px}.card-value{font-size:16px}}
</style>
</head>
<body>
<header>
  <div class="scan"></div>
  <div class="wolf">🐺</div>
  <h1>${st.botName}</h1>
  <div class="ver">v${st.version} // STATUS TERMINAL</div>
  <div class="status-pill"><div class="dot"></div>${statusLabel}</div>
</header>

<div class="grid">
  <div class="card">
    <div class="card-label">// UPTIME</div>
    <div class="card-value uptime">${st.uptime}</div>
  </div>
  <div class="card">
    <div class="card-label">// COMMANDS</div>
    <div class="card-value accent">${st.commands}</div>
  </div>
  <div class="card">
    <div class="card-label">// PREFIX</div>
    <div class="card-value accent">${st.prefix === 'none' ? '(none)' : st.prefix}</div>
  </div>
  <div class="card">
    <div class="card-label">// MODE</div>
    <div class="card-value mode">${st.botMode.toUpperCase()}</div>
  </div>
  <div class="card">
    <div class="card-label">// OWNER</div>
    <div class="card-value" style="font-size:14px;color:#a3ffcb">+${st.owner}</div>
  </div>
  <div class="card">
    <div class="card-label">// LAST PING</div>
    <div class="card-value dim">${new Date().toLocaleTimeString()}</div>
  </div>
</div>

<div class="badges">
  ${badge(st.antispam,  'ANTI-SPAM')}
  ${badge(st.antibug,   'ANTI-BUG')}
  ${badge(st.antilink,  'ANTI-LINK')}
</div>

<div class="platform-card">
  <div class="p-label">// RUNTIME ENVIRONMENT</div>
  <div class="plat">${st.platform}</div>
</div>

<div class="links">
  <a class="btn btn-primary" href="/api/status">[ JSON STATUS ]</a>
  <a class="btn btn-ghost"   href="/health">[ HEALTH CHECK ]</a>
</div>

<footer>
  POWERED BY <span>SILENT WOLF TECH</span> &nbsp;//&nbsp; AUTO-REFRESH 30s
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

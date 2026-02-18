import axios from 'axios';
import net from 'net';
import dns from 'dns';
import { promisify } from 'util';

const dnsResolve = promisify(dns.resolve4);

const DB_ERROR_PATTERNS = [
  { name: 'MySQL', patterns: ['you have an error in your sql syntax', 'warning: mysql', 'unclosed quotation mark', 'mysql_fetch', 'mysql_num_rows', 'mysql_query', 'mysqli_', 'MariaDB server version'] },
  { name: 'PostgreSQL', patterns: ['pg_query', 'pg_exec', 'postgresql', 'PSQLException', 'unterminated quoted string', 'ERROR:  syntax error at or near', 'valid PostgreSQL result'] },
  { name: 'MSSQL', patterns: ['microsoft sql server', 'unclosed quotation mark after the character string', 'mssql_query', 'odbc_exec', 'SQLServer JDBC Driver', 'com.microsoft.sqlserver'] },
  { name: 'Oracle', patterns: ['ORA-', 'oracle error', 'oracle.*driver', 'quoted string not properly terminated', 'SQL command not properly ended'] },
  { name: 'SQLite', patterns: ['sqlite_', 'sqlite3', 'SQLite3::query', 'SQLITE_ERROR', 'near "": syntax error'] },
  { name: 'Generic SQL', patterns: ['sql syntax', 'sql error', 'syntax error', 'database error', 'query failed', 'SQLSTATE', 'PDOException', 'jdbc:', 'ODBCException'] }
];

async function checkPort(host, port, timeout = 3000) {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    socket.setTimeout(timeout);
    socket.on('connect', () => { socket.destroy(); resolve(true); });
    socket.on('timeout', () => { socket.destroy(); resolve(false); });
    socket.on('error', () => { socket.destroy(); resolve(false); });
    try { socket.connect(port, host); } catch { resolve(false); }
  });
}

export default {
  name: 'sqlicheck',
  alias: ['sqliscan', 'sqli'],
  description: 'SQL injection risk checker - analyzes response patterns for database exposure',
  category: 'ethical hacking',
  usage: 'sqlicheck <url>',
  async execute(sock, m, args, PREFIX) {
    const jid = m.key.remoteJid;
    if (!args[0]) {
      return sock.sendMessage(jid, { text: `╭─⌈ 🛡️ *SQL INJECTION RISK CHECKER* ⌋\n│\n├─⊷ *${PREFIX}sqlicheck <url>*\n│  └⊷ Analyze a site for SQL injection risk indicators\n│\n├─⊷ *Checks:*\n│  ├⊷ Database error patterns in responses\n│  ├⊷ Exposed database ports\n│  ├⊷ Error page information disclosure\n│  └⊷ Server header analysis\n│\n├─⊷ ⚠️ Does NOT inject payloads\n╰───────────────\n> *WOLFBOT*` }, { quoted: m });
    }

    await sock.sendMessage(jid, { react: { text: '⏳', key: m.key } });

    try {
      let target = args[0];
      if (!/^https?:\/\//i.test(target)) target = 'https://' + target;
      const urlObj = new URL(target);
      const hostname = urlObj.hostname;
      const findings = [];
      let riskScore = 0;

      const response = await axios.get(target, {
        timeout: 15000,
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
        maxRedirects: 5,
        validateStatus: () => true
      });

      const body = (typeof response.data === 'string' ? response.data : JSON.stringify(response.data || '')).toLowerCase();

      const detectedDbs = [];
      for (const db of DB_ERROR_PATTERNS) {
        for (const pattern of db.patterns) {
          if (body.includes(pattern.toLowerCase())) {
            if (!detectedDbs.includes(db.name)) detectedDbs.push(db.name);
            break;
          }
        }
      }

      if (detectedDbs.length > 0) {
        findings.push({ field: 'DB Error Disclosure', status: '❌ Detected', risk: 'Critical', detail: `Database error patterns found: ${detectedDbs.join(', ')}` });
        riskScore += 30;
      } else {
        findings.push({ field: 'DB Error Disclosure', status: '✅ None', risk: 'Low', detail: 'No database error patterns found in response' });
      }

      const testPaths = ['/', '/?id=1', '/404notfound'];
      let errorInfoLeaks = 0;
      for (const p of testPaths) {
        try {
          const testUrl = `${urlObj.origin}${p}`;
          const testResp = await axios.get(testUrl, {
            timeout: 10000,
            headers: { 'User-Agent': 'Mozilla/5.0' },
            validateStatus: () => true
          });
          const testBody = (typeof testResp.data === 'string' ? testResp.data : '').toLowerCase();
          const leakPatterns = ['stack trace', 'debug', 'exception', 'traceback', 'error in', 'fatal error', 'warning:', 'notice:', 'parse error'];
          for (const lp of leakPatterns) {
            if (testBody.includes(lp)) { errorInfoLeaks++; break; }
          }
        } catch { }
      }

      if (errorInfoLeaks > 0) {
        findings.push({ field: 'Error Page Info Leak', status: '⚠️ Detected', risk: 'Medium', detail: `${errorInfoLeaks} page(s) reveal debug/error information` });
        riskScore += 15;
      } else {
        findings.push({ field: 'Error Page Info Leak', status: '✅ Clean', risk: 'Low', detail: 'Error pages do not reveal debug info' });
      }

      const serverHeader = response.headers['server'] || '';
      const poweredBy = response.headers['x-powered-by'] || '';
      if (serverHeader || poweredBy) {
        findings.push({ field: 'Server Disclosure', status: '⚠️ Exposed', risk: 'Low', detail: `Server: ${serverHeader || 'N/A'} | Powered-By: ${poweredBy || 'N/A'}` });
        riskScore += 5;
      } else {
        findings.push({ field: 'Server Disclosure', status: '✅ Hidden', risk: 'Low', detail: 'Server/technology headers not exposed' });
      }

      let ip = hostname;
      try {
        const ips = await dnsResolve(hostname);
        if (ips.length > 0) ip = ips[0];
      } catch { }

      const dbPorts = [
        { port: 3306, name: 'MySQL' },
        { port: 5432, name: 'PostgreSQL' },
        { port: 1433, name: 'MSSQL' },
        { port: 1521, name: 'Oracle' },
        { port: 27017, name: 'MongoDB' },
        { port: 6379, name: 'Redis' }
      ];

      const exposedPorts = [];
      const portChecks = dbPorts.map(async (db) => {
        const open = await checkPort(ip, db.port);
        if (open) exposedPorts.push(db);
      });
      await Promise.all(portChecks);

      if (exposedPorts.length > 0) {
        findings.push({ field: 'Exposed DB Ports', status: '❌ Open', risk: 'Critical', detail: exposedPorts.map(p => `${p.name} (${p.port})`).join(', ') });
        riskScore += 25;
      } else {
        findings.push({ field: 'Exposed DB Ports', status: '✅ Closed', risk: 'Low', detail: 'No database ports accessible from outside' });
      }

      const forms = body.match(/<form[^>]*>[\s\S]*?<\/form>/gi) || [];
      let inputCount = 0;
      for (const form of forms) {
        const inputs = form.match(/<input[^>]*>/gi) || [];
        inputCount += inputs.length;
      }
      if (inputCount > 0) {
        findings.push({ field: 'Input Fields', status: 'ℹ️ Found', risk: 'Info', detail: `${inputCount} input field(s) in ${forms.length} form(s) — server-side validation needed` });
      }

      riskScore = Math.min(riskScore, 100);
      let riskLevel = riskScore >= 50 ? '🔴 HIGH' : riskScore >= 25 ? '🟡 MEDIUM' : '🟢 LOW';

      let result = `╭─⌈ 🛡️ *SQL INJECTION RISK CHECK* ⌋\n│\n`;
      result += `├─⊷ *Target:* ${target}\n`;
      result += `├─⊷ *Resolved IP:* ${ip}\n`;
      result += `├─⊷ *Risk Score:* ${riskScore}/100 (${riskLevel})\n│\n`;
      result += `├─⌈ 📋 *FINDINGS* ⌋\n│\n`;

      for (const f of findings) {
        result += `├─⊷ *${f.field}:* ${f.status}\n`;
        result += `│  └⊷ Risk: ${f.risk} — ${f.detail}\n│\n`;
      }

      result += `├─⌈ 💡 *RECOMMENDATIONS* ⌋\n│\n`;
      result += `├─⊷ Use parameterized queries/prepared statements\n`;
      result += `├─⊷ Implement input validation and sanitization\n`;
      result += `├─⊷ Disable detailed error messages in production\n`;
      result += `├─⊷ Restrict database port access with firewall rules\n`;
      result += `│\n╰───────────────\n> *WOLFBOT*`;

      await sock.sendMessage(jid, { text: result }, { quoted: m });
      await sock.sendMessage(jid, { react: { text: '✅', key: m.key } });
    } catch (err) {
      await sock.sendMessage(jid, { react: { text: '❌', key: m.key } });
      await sock.sendMessage(jid, { text: `❌ Error: ${err.message}` }, { quoted: m });
    }
  }
};

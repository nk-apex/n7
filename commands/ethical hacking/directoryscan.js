import axios from 'axios';

const COMMON_PATHS = [
  '/admin', '/login', '/wp-admin', '/phpmyadmin',
  '/.env', '/.git', '/backup', '/api',
  '/config', '/database', '/upload', '/test',
  '/debug', '/console', '/swagger', '/graphql',
  '/.well-known', '/robots.txt', '/sitemap.xml', '/server-status'
];

export default {
  name: 'directoryscan',
  alias: ['dirscan', 'pathscan'],
  description: 'Common directory/path scanner - checks for sensitive directories',
  category: 'ethical hacking',
  usage: 'directoryscan <url>',
  async execute(sock, m, args, PREFIX) {
    const jid = m.key.remoteJid;
    if (!args[0]) {
      return sock.sendMessage(jid, { text: `╭─⌈ 🛡️ *DIRECTORY SCANNER* ⌋\n│\n├─⊷ *${PREFIX}directoryscan <url>*\n│  └⊷ Scan for common sensitive directories and paths\n│\n├─⊷ *Scans ${COMMON_PATHS.length} paths including:*\n│  ├⊷ Admin panels, login pages\n│  ├⊷ Config files, backups\n│  ├⊷ API endpoints, debug consoles\n│  └⊷ Version control, server status\n╰───────────────\n> *WOLFBOT*` }, { quoted: m });
    }

    await sock.sendMessage(jid, { react: { text: '⏳', key: m.key } });

    try {
      let target = args[0];
      if (!/^https?:\/\//i.test(target)) target = 'https://' + target;
      const urlObj = new URL(target);
      const baseUrl = urlObj.origin;

      const found = [];
      const forbidden = [];
      const redirects = [];
      const notFound = [];

      const checkPath = async (path) => {
        try {
          const resp = await axios.head(`${baseUrl}${path}`, {
            timeout: 8000,
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
            maxRedirects: 0,
            validateStatus: () => true
          });
          const status = resp.status;
          if (status >= 200 && status < 300) {
            found.push({ path, status });
          } else if (status === 301 || status === 302) {
            const location = resp.headers['location'] || 'unknown';
            redirects.push({ path, status, location });
          } else if (status === 403) {
            forbidden.push({ path, status });
          } else {
            notFound.push({ path, status });
          }
        } catch {
          notFound.push({ path, status: 'timeout' });
        }
      };

      const batchSize = 5;
      for (let i = 0; i < COMMON_PATHS.length; i += batchSize) {
        const batch = COMMON_PATHS.slice(i, i + batchSize);
        await Promise.all(batch.map(p => checkPath(p)));
      }

      let result = `╭─⌈ 🛡️ *DIRECTORY SCAN RESULTS* ⌋\n│\n`;
      result += `├─⊷ *Target:* ${baseUrl}\n`;
      result += `├─⊷ *Paths Scanned:* ${COMMON_PATHS.length}\n`;
      result += `├─⊷ *Found:* ${found.length} | *Forbidden:* ${forbidden.length} | *Redirects:* ${redirects.length}\n│\n`;

      if (found.length > 0) {
        result += `├─⌈ ✅ *ACCESSIBLE (${found.length})* ⌋\n│\n`;
        for (const f of found) {
          result += `├─⊷ *${f.path}* — ${f.status} OK\n`;
        }
        result += `│\n`;
      }

      if (forbidden.length > 0) {
        result += `├─⌈ 🔒 *FORBIDDEN (${forbidden.length})* ⌋\n│\n`;
        for (const f of forbidden) {
          result += `├─⊷ *${f.path}* — 403 Forbidden\n`;
        }
        result += `│\n`;
      }

      if (redirects.length > 0) {
        result += `├─⌈ 🔄 *REDIRECTS (${redirects.length})* ⌋\n│\n`;
        for (const f of redirects) {
          result += `├─⊷ *${f.path}* — ${f.status} → ${f.location.substring(0, 60)}\n`;
        }
        result += `│\n`;
      }

      result += `├─⌈ ❌ *NOT FOUND (${notFound.length})* ⌋\n│\n`;
      if (notFound.length > 10) {
        result += `├─⊷ ${notFound.length} paths returned 404/timeout\n│\n`;
      } else {
        for (const f of notFound) {
          result += `├─⊷ ${f.path} — ${f.status}\n`;
        }
        result += `│\n`;
      }

      const sensitiveFound = found.filter(f =>
        ['/.env', '/.git', '/backup', '/config', '/database', '/debug', '/console', '/server-status'].includes(f.path)
      );

      if (sensitiveFound.length > 0) {
        result += `├─⌈ ⚠️ *SENSITIVE PATHS EXPOSED* ⌋\n│\n`;
        for (const f of sensitiveFound) {
          result += `├─⊷ 🚨 *${f.path}* is publicly accessible!\n`;
        }
        result += `│\n`;
      }

      result += `├─⌈ 💡 *RECOMMENDATIONS* ⌋\n│\n`;
      result += `├─⊷ Restrict access to admin/config paths\n`;
      result += `├─⊷ Remove or protect sensitive files\n`;
      result += `├─⊷ Use .htaccess or server rules to block access\n`;
      result += `│\n╰───────────────\n> *WOLFBOT*`;

      await sock.sendMessage(jid, { text: result }, { quoted: m });
      await sock.sendMessage(jid, { react: { text: '✅', key: m.key } });
    } catch (err) {
      await sock.sendMessage(jid, { react: { text: '❌', key: m.key } });
      await sock.sendMessage(jid, { text: `❌ Error: ${err.message}` }, { quoted: m });
    }
  }
};

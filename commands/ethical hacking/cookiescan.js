import axios from 'axios';

export default {
  name: 'cookiescan',
  alias: ['cookies', 'cookiecheck'],
  description: 'Scan and analyze website cookies',
  category: 'ethical hacking',
  usage: 'cookiescan <url>',
  async execute(sock, m, args, PREFIX) {
    const jid = m.key.remoteJid;
    if (!args[0]) {
      return sock.sendMessage(jid, { text: `╭─⌈ 🍪 *COOKIE SCANNER* ⌋\n│\n├─⊷ *${PREFIX}cookiescan <url>*\n│  └⊷ Scan and analyze website cookies\n│\n├─⊷ *Example:*\n│  └⊷ ${PREFIX}cookiescan google.com\n╰───────────────\n> *WOLFBOT*` }, { quoted: m });
    }
    await sock.sendMessage(jid, { react: { text: '⏳', key: m.key } });
    try {
      let target = args[0].trim();
      if (!/^https?:\/\//i.test(target)) target = 'https://' + target;

      const res = await axios.get(target, {
        timeout: 15000,
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
        maxRedirects: 5,
        validateStatus: () => true
      });

      const setCookieHeaders = res.headers['set-cookie'];
      if (!setCookieHeaders || setCookieHeaders.length === 0) {
        const result = `╭─⌈ 🍪 *COOKIE SCAN* ⌋\n│\n├─⊷ *Target:* ${target}\n├─⊷ *Status:* No cookies set\n│\n├─⊷ This website did not set any\n│  └⊷ cookies on the initial request\n╰───────────────\n> *WOLFBOT*`;
        await sock.sendMessage(jid, { text: result }, { quoted: m });
        await sock.sendMessage(jid, { react: { text: '✅', key: m.key } });
        return;
      }

      const cookieList = Array.isArray(setCookieHeaders) ? setCookieHeaders : [setCookieHeaders];
      let secureCount = 0;
      let insecureCount = 0;
      let cookieDetails = '';

      cookieList.slice(0, 15).forEach((cookie, i) => {
        const parts = cookie.split(';').map(p => p.trim());
        const nameVal = parts[0] || '';
        const name = nameVal.split('=')[0] || 'Unknown';
        const lower = cookie.toLowerCase();

        const httpOnly = lower.includes('httponly');
        const secure = lower.includes('secure');
        const sameSiteMatch = lower.match(/samesite=(\w+)/);
        const sameSite = sameSiteMatch ? sameSiteMatch[1] : 'Not set';
        const pathMatch = lower.match(/path=([^;]+)/);
        const path = pathMatch ? pathMatch[1].trim() : '/';
        const domainMatch = lower.match(/domain=([^;]+)/);
        const domain = domainMatch ? domainMatch[1].trim() : 'Current domain';
        const expiresMatch = cookie.match(/expires=([^;]+)/i);
        const maxAgeMatch = lower.match(/max-age=([^;]+)/);
        const expiry = expiresMatch ? expiresMatch[1].trim() : maxAgeMatch ? `${maxAgeMatch[1].trim()}s` : 'Session';

        const issues = [];
        if (!httpOnly) issues.push('No HttpOnly');
        if (!secure) issues.push('No Secure flag');
        if (sameSite === 'Not set' || sameSite === 'none') issues.push('Weak SameSite');

        if (issues.length === 0) secureCount++;
        else insecureCount++;

        cookieDetails += `├─⊷ 🍪 *Cookie ${i + 1}: ${name.substring(0, 30)}*\n`;
        cookieDetails += `│  └⊷ HttpOnly: ${httpOnly ? '✅' : '❌'}\n`;
        cookieDetails += `│  └⊷ Secure: ${secure ? '✅' : '❌'}\n`;
        cookieDetails += `│  └⊷ SameSite: ${sameSite}\n`;
        cookieDetails += `│  └⊷ Path: ${path}\n`;
        cookieDetails += `│  └⊷ Domain: ${domain}\n`;
        cookieDetails += `│  └⊷ Expiry: ${expiry}\n`;
        if (issues.length > 0) {
          cookieDetails += `│  └⊷ ⚠️ Issues: ${issues.join(', ')}\n`;
        }
        cookieDetails += `│\n`;
      });

      if (cookieList.length > 15) {
        cookieDetails += `├─⊷ ...and ${cookieList.length - 15} more cookies\n│\n`;
      }

      const total = secureCount + insecureCount;
      const score = total > 0 ? Math.round((secureCount / total) * 100) : 0;

      let output = `╭─⌈ 🍪 *COOKIE SCAN RESULTS* ⌋\n│\n├─⊷ *Target:* ${target}\n├─⊷ *Total Cookies:* ${cookieList.length}\n├─⊷ ✅ *Secure:* ${secureCount}\n├─⊷ ❌ *Insecure:* ${insecureCount}\n├─⊷ 📊 *Security Score:* ${score}%\n│\n${cookieDetails}╰───────────────\n> *WOLFBOT*`;

      await sock.sendMessage(jid, { text: output }, { quoted: m });
      await sock.sendMessage(jid, { react: { text: '✅', key: m.key } });
    } catch (err) {
      await sock.sendMessage(jid, { react: { text: '❌', key: m.key } });
      await sock.sendMessage(jid, { text: `❌ Error: ${err.message}` }, { quoted: m });
    }
  }
};

import axios from 'axios';

export default {
  name: 'csrfcheck',
  alias: ['csrfscan', 'csrf'],
  description: 'CSRF vulnerability checker - analyzes forms and headers for CSRF protection',
  category: 'ethical hacking',
  usage: 'csrfcheck <url>',
  async execute(sock, m, args, PREFIX) {
    const jid = m.key.remoteJid;
    if (!args[0]) {
      return sock.sendMessage(jid, { text: `╭─⌈ 🛡️ *CSRF VULNERABILITY CHECKER* ⌋\n│\n├─⊷ *${PREFIX}csrfcheck <url>*\n│  └⊷ Check a website for CSRF protection\n│\n├─⊷ *Checks:*\n│  ├⊷ CSRF tokens in forms\n│  ├⊷ SameSite cookie attributes\n│  ├⊷ Custom header requirements\n│  └⊷ Referer/Origin validation\n╰───────────────\n> *WOLFBOT*` }, { quoted: m });
    }

    await sock.sendMessage(jid, { react: { text: '⏳', key: m.key } });

    try {
      let target = args[0];
      if (!/^https?:\/\//i.test(target)) target = 'https://' + target;

      const response = await axios.get(target, {
        timeout: 15000,
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
        maxRedirects: 5,
        validateStatus: () => true
      });

      const headers = response.headers;
      const html = typeof response.data === 'string' ? response.data : '';
      const findings = [];
      let riskScore = 0;

      const forms = html.match(/<form[^>]*>[\s\S]*?<\/form>/gi) || [];
      const csrfTokenPatterns = /csrf|_token|authenticity_token|__RequestVerificationToken|antiforgery|xsrf/i;
      let formsWithToken = 0;
      let formsWithoutToken = 0;

      for (const form of forms) {
        const inputs = form.match(/<input[^>]*>/gi) || [];
        const metaTags = html.match(/<meta[^>]*csrf[^>]*>/gi) || [];
        const hasToken = inputs.some(inp => csrfTokenPatterns.test(inp)) || metaTags.length > 0;
        if (hasToken) formsWithToken++;
        else formsWithoutToken++;
      }

      if (forms.length === 0) {
        findings.push({ field: 'CSRF Tokens in Forms', status: 'ℹ️ N/A', risk: 'Info', detail: 'No forms detected on this page' });
      } else if (formsWithoutToken > 0) {
        findings.push({ field: 'CSRF Tokens in Forms', status: '❌ Missing', risk: 'High', detail: `${formsWithoutToken}/${forms.length} form(s) lack CSRF tokens` });
        riskScore += 30;
      } else {
        findings.push({ field: 'CSRF Tokens in Forms', status: '✅ Present', risk: 'Low', detail: `All ${forms.length} form(s) have CSRF tokens` });
      }

      const metaCsrf = html.match(/<meta[^>]*(csrf|xsrf|_token)[^>]*>/gi) || [];
      if (metaCsrf.length > 0) {
        findings.push({ field: 'Meta CSRF Tags', status: '✅ Found', risk: 'Low', detail: `${metaCsrf.length} CSRF meta tag(s) found (AJAX protection)` });
      } else {
        findings.push({ field: 'Meta CSRF Tags', status: '⚠️ Missing', risk: 'Medium', detail: 'No CSRF meta tags for AJAX protection' });
        riskScore += 10;
      }

      const setCookies = headers['set-cookie'];
      const cookieArray = Array.isArray(setCookies) ? setCookies : (setCookies ? [setCookies] : []);

      if (cookieArray.length === 0) {
        findings.push({ field: 'SameSite Cookie', status: 'ℹ️ N/A', risk: 'Info', detail: 'No Set-Cookie headers in response' });
      } else {
        let sameSiteCount = 0;
        let sameSiteValues = [];
        for (const cookie of cookieArray) {
          const sameSiteMatch = cookie.match(/SameSite\s*=\s*(Strict|Lax|None)/i);
          if (sameSiteMatch) {
            sameSiteCount++;
            sameSiteValues.push(sameSiteMatch[1]);
          }
        }

        if (sameSiteCount === 0) {
          findings.push({ field: 'SameSite Cookie', status: '❌ Missing', risk: 'High', detail: `None of ${cookieArray.length} cookie(s) have SameSite attribute` });
          riskScore += 20;
        } else if (sameSiteValues.some(v => v.toLowerCase() === 'none')) {
          findings.push({ field: 'SameSite Cookie', status: '⚠️ Weak', risk: 'Medium', detail: `SameSite=None found — cookies sent on cross-origin requests` });
          riskScore += 10;
        } else {
          findings.push({ field: 'SameSite Cookie', status: '✅ Set', risk: 'Low', detail: `SameSite values: ${[...new Set(sameSiteValues)].join(', ')}` });
        }

        const httpOnlyCount = cookieArray.filter(c => /HttpOnly/i.test(c)).length;
        const secureCount = cookieArray.filter(c => /;\s*Secure/i.test(c)).length;
        findings.push({ field: 'Cookie Flags', status: httpOnlyCount === cookieArray.length ? '✅ Good' : '⚠️ Mixed', risk: httpOnlyCount < cookieArray.length ? 'Medium' : 'Low', detail: `HttpOnly: ${httpOnlyCount}/${cookieArray.length} | Secure: ${secureCount}/${cookieArray.length}` });
        if (httpOnlyCount < cookieArray.length) riskScore += 10;
      }

      const cors = headers['access-control-allow-origin'] || '';
      const corsCredentials = headers['access-control-allow-credentials'] || '';
      if (cors === '*') {
        findings.push({ field: 'CORS Policy', status: '⚠️ Open', risk: 'Medium', detail: 'Access-Control-Allow-Origin: * (any origin allowed)' });
        riskScore += 10;
      } else if (cors && corsCredentials.toLowerCase() === 'true') {
        findings.push({ field: 'CORS Policy', status: '⚠️ Credentials', risk: 'Medium', detail: `Origin: ${cors} with credentials allowed` });
        riskScore += 5;
      } else if (cors) {
        findings.push({ field: 'CORS Policy', status: '✅ Restricted', risk: 'Low', detail: `Origin restricted to: ${cors}` });
      } else {
        findings.push({ field: 'CORS Policy', status: '✅ Not set', risk: 'Low', detail: 'No CORS headers (same-origin by default)' });
      }

      const referrerPolicy = headers['referrer-policy'] || '';
      if (!referrerPolicy) {
        findings.push({ field: 'Referrer Policy', status: '⚠️ Missing', risk: 'Low', detail: 'No Referrer-Policy header set' });
        riskScore += 5;
      } else {
        findings.push({ field: 'Referrer Policy', status: '✅ Set', risk: 'Low', detail: `Value: ${referrerPolicy}` });
      }

      riskScore = Math.min(riskScore, 100);
      let riskLevel = riskScore >= 50 ? '🔴 HIGH' : riskScore >= 25 ? '🟡 MEDIUM' : '🟢 LOW';

      let result = `╭─⌈ 🛡️ *CSRF VULNERABILITY CHECK* ⌋\n│\n`;
      result += `├─⊷ *Target:* ${target}\n`;
      result += `├─⊷ *Status Code:* ${response.status}\n`;
      result += `├─⊷ *Forms Found:* ${forms.length}\n`;
      result += `├─⊷ *Risk Score:* ${riskScore}/100 (${riskLevel})\n│\n`;
      result += `├─⌈ 📋 *FINDINGS* ⌋\n│\n`;

      for (const f of findings) {
        result += `├─⊷ *${f.field}:* ${f.status}\n`;
        result += `│  └⊷ Risk: ${f.risk} — ${f.detail}\n│\n`;
      }

      result += `├─⌈ 💡 *RECOMMENDATIONS* ⌋\n│\n`;
      if (formsWithoutToken > 0) result += `├─⊷ Add CSRF tokens to all forms\n`;
      result += `├─⊷ Set SameSite=Strict or Lax on session cookies\n`;
      result += `├─⊷ Validate Origin/Referer headers server-side\n`;
      result += `├─⊷ Use anti-CSRF tokens for state-changing operations\n`;
      result += `│\n╰───────────────\n> *WOLFBOT*`;

      await sock.sendMessage(jid, { text: result }, { quoted: m });
      await sock.sendMessage(jid, { react: { text: '✅', key: m.key } });
    } catch (err) {
      await sock.sendMessage(jid, { react: { text: '❌', key: m.key } });
      await sock.sendMessage(jid, { text: `❌ Error: ${err.message}` }, { quoted: m });
    }
  }
};

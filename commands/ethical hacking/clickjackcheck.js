import axios from 'axios';

export default {
  name: 'clickjackcheck',
  alias: ['clickjack', 'frameguard'],
  description: 'Clickjacking vulnerability checker - checks frame protection headers',
  category: 'ethical hacking',
  usage: 'clickjackcheck <url>',
  async execute(sock, m, args, PREFIX) {
    const jid = m.key.remoteJid;
    if (!args[0]) {
      return sock.sendMessage(jid, { text: `╭─⌈ 🛡️ *CLICKJACKING CHECKER* ⌋\n│\n├─⊷ *${PREFIX}clickjackcheck <url>*\n│  └⊷ Check if a website is vulnerable to clickjacking\n│\n├─⊷ *Checks:*\n│  ├⊷ X-Frame-Options header\n│  ├⊷ CSP frame-ancestors directive\n│  └⊷ Overall iframe protection\n╰───────────────\n> *WOLFBOT*` }, { quoted: m });
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
      const findings = [];
      let riskScore = 0;
      let canBeIframed = true;

      const xfo = (headers['x-frame-options'] || '').toUpperCase();
      if (!xfo) {
        findings.push({ field: 'X-Frame-Options', status: '❌ Missing', risk: 'High', detail: 'No X-Frame-Options header — page can be embedded in iframes' });
        riskScore += 35;
      } else if (xfo === 'DENY') {
        findings.push({ field: 'X-Frame-Options', status: '✅ DENY', risk: 'Low', detail: 'Page cannot be displayed in any iframe' });
        canBeIframed = false;
      } else if (xfo === 'SAMEORIGIN') {
        findings.push({ field: 'X-Frame-Options', status: '✅ SAMEORIGIN', risk: 'Low', detail: 'Page can only be iframed by same origin' });
        canBeIframed = false;
      } else if (xfo.startsWith('ALLOW-FROM')) {
        findings.push({ field: 'X-Frame-Options', status: '⚠️ ALLOW-FROM', risk: 'Medium', detail: `Allowed from: ${xfo.replace('ALLOW-FROM', '').trim()} (deprecated directive)` });
        riskScore += 10;
      } else {
        findings.push({ field: 'X-Frame-Options', status: '⚠️ Invalid', risk: 'Medium', detail: `Invalid value: ${xfo}` });
        riskScore += 15;
      }

      const csp = headers['content-security-policy'] || '';
      const frameAncestorsMatch = csp.match(/frame-ancestors\s+([^;]+)/i);
      if (frameAncestorsMatch) {
        const frameAncestors = frameAncestorsMatch[1].trim();
        if (frameAncestors === "'none'") {
          findings.push({ field: 'CSP frame-ancestors', status: "✅ 'none'", risk: 'Low', detail: 'No framing allowed via CSP' });
          canBeIframed = false;
        } else if (frameAncestors === "'self'") {
          findings.push({ field: 'CSP frame-ancestors', status: "✅ 'self'", risk: 'Low', detail: 'Only same-origin framing allowed via CSP' });
          canBeIframed = false;
        } else {
          findings.push({ field: 'CSP frame-ancestors', status: '⚠️ Custom', risk: 'Medium', detail: `Allowed origins: ${frameAncestors}` });
          riskScore += 5;
        }
      } else if (csp) {
        findings.push({ field: 'CSP frame-ancestors', status: '❌ Not set', risk: 'Medium', detail: 'CSP exists but no frame-ancestors directive' });
        riskScore += 15;
      } else {
        findings.push({ field: 'CSP frame-ancestors', status: '❌ No CSP', risk: 'High', detail: 'No Content-Security-Policy header at all' });
        riskScore += 20;
      }

      if (canBeIframed) {
        findings.push({ field: 'Iframe Protection', status: '❌ Vulnerable', risk: 'High', detail: 'Page CAN be embedded in an iframe by any origin' });
        riskScore += 20;
      } else {
        findings.push({ field: 'Iframe Protection', status: '✅ Protected', risk: 'Low', detail: 'Page is protected against iframe embedding' });
      }

      const html = typeof response.data === 'string' ? response.data : '';
      const hasFramebusting = /top\s*[\.\[].*(?:location|self)|window\s*\.\s*top|self\s*!==?\s*top|top\s*!==?\s*self/i.test(html);
      if (hasFramebusting) {
        findings.push({ field: 'JS Frame-busting', status: '⚠️ Detected', risk: 'Info', detail: 'JavaScript frame-busting code found (can be bypassed)' });
      } else {
        findings.push({ field: 'JS Frame-busting', status: 'ℹ️ Not found', risk: 'Info', detail: 'No JavaScript frame-busting detected' });
      }

      const permissionsPolicy = headers['permissions-policy'] || headers['feature-policy'] || '';
      if (permissionsPolicy) {
        findings.push({ field: 'Permissions Policy', status: '✅ Set', risk: 'Low', detail: `Policy configured: ${permissionsPolicy.substring(0, 80)}${permissionsPolicy.length > 80 ? '...' : ''}` });
      } else {
        findings.push({ field: 'Permissions Policy', status: '⚠️ Missing', risk: 'Low', detail: 'No Permissions-Policy/Feature-Policy header' });
        riskScore += 5;
      }

      riskScore = Math.min(riskScore, 100);
      let riskLevel = riskScore >= 50 ? '🔴 HIGH' : riskScore >= 25 ? '🟡 MEDIUM' : '🟢 LOW';

      let result = `╭─⌈ 🛡️ *CLICKJACKING VULNERABILITY CHECK* ⌋\n│\n`;
      result += `├─⊷ *Target:* ${target}\n`;
      result += `├─⊷ *Status Code:* ${response.status}\n`;
      result += `├─⊷ *Can be iframed:* ${canBeIframed ? '❌ Yes (vulnerable)' : '✅ No (protected)'}\n`;
      result += `├─⊷ *Risk Score:* ${riskScore}/100 (${riskLevel})\n│\n`;
      result += `├─⌈ 📋 *FINDINGS* ⌋\n│\n`;

      for (const f of findings) {
        result += `├─⊷ *${f.field}:* ${f.status}\n`;
        result += `│  └⊷ Risk: ${f.risk} — ${f.detail}\n│\n`;
      }

      result += `├─⌈ 💡 *RECOMMENDATIONS* ⌋\n│\n`;
      if (canBeIframed) {
        result += `├─⊷ Add X-Frame-Options: DENY or SAMEORIGIN\n`;
        result += `├─⊷ Set CSP frame-ancestors 'self' or 'none'\n`;
      } else {
        result += `├─⊷ Good clickjacking protection detected!\n`;
      }
      result += `├─⊷ Don't rely solely on JS frame-busting\n`;
      result += `│\n╰───────────────\n> *WOLFBOT*`;

      await sock.sendMessage(jid, { text: result }, { quoted: m });
      await sock.sendMessage(jid, { react: { text: '✅', key: m.key } });
    } catch (err) {
      await sock.sendMessage(jid, { react: { text: '❌', key: m.key } });
      await sock.sendMessage(jid, { text: `❌ Error: ${err.message}` }, { quoted: m });
    }
  }
};

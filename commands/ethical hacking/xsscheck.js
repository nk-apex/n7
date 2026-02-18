import axios from 'axios';

export default {
  name: 'xsscheck',
  alias: ['xssscan', 'xss'],
  description: 'XSS vulnerability checker - analyzes headers and page content for XSS risks',
  category: 'ethical hacking',
  usage: 'xsscheck <url>',
  async execute(sock, m, args, PREFIX) {
    const jid = m.key.remoteJid;
    if (!args[0]) {
      return sock.sendMessage(jid, { text: `╭─⌈ 🛡️ *XSS VULNERABILITY CHECKER* ⌋\n│\n├─⊷ *${PREFIX}xsscheck <url>*\n│  └⊷ Check a website for XSS vulnerability indicators\n│\n├─⊷ *Checks:*\n│  ├⊷ Content-Security-Policy header\n│  ├⊷ X-XSS-Protection header\n│  ├⊷ Inline scripts without nonce\n│  ├⊷ Forms without proper encoding\n│  └⊷ Reflected input in URL params\n╰───────────────\n> *WOLFBOT*` }, { quoted: m });
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

      const csp = headers['content-security-policy'] || '';
      if (!csp) {
        findings.push({ field: 'Content-Security-Policy', status: '❌ Missing', risk: 'High', detail: 'No CSP header found - allows inline script execution' });
        riskScore += 25;
      } else {
        const hasUnsafeInline = csp.includes("'unsafe-inline'");
        const hasUnsafeEval = csp.includes("'unsafe-eval'");
        if (hasUnsafeInline || hasUnsafeEval) {
          findings.push({ field: 'Content-Security-Policy', status: '⚠️ Weak', risk: 'Medium', detail: `CSP present but allows ${hasUnsafeInline ? "'unsafe-inline'" : ''} ${hasUnsafeEval ? "'unsafe-eval'" : ''}`.trim() });
          riskScore += 15;
        } else {
          findings.push({ field: 'Content-Security-Policy', status: '✅ Present', risk: 'Low', detail: 'CSP is configured properly' });
        }
      }

      const xssProtection = headers['x-xss-protection'] || '';
      if (!xssProtection) {
        findings.push({ field: 'X-XSS-Protection', status: '❌ Missing', risk: 'Medium', detail: 'Browser XSS filter not explicitly enabled' });
        riskScore += 15;
      } else if (xssProtection.includes('0')) {
        findings.push({ field: 'X-XSS-Protection', status: '❌ Disabled', risk: 'High', detail: 'XSS protection explicitly disabled' });
        riskScore += 20;
      } else {
        findings.push({ field: 'X-XSS-Protection', status: '✅ Enabled', risk: 'Low', detail: `Value: ${xssProtection}` });
      }

      const xContentType = headers['x-content-type-options'] || '';
      if (!xContentType || xContentType !== 'nosniff') {
        findings.push({ field: 'X-Content-Type-Options', status: '❌ Missing/Weak', risk: 'Medium', detail: 'Missing nosniff - MIME type sniffing possible' });
        riskScore += 10;
      } else {
        findings.push({ field: 'X-Content-Type-Options', status: '✅ nosniff', risk: 'Low', detail: 'MIME type sniffing prevented' });
      }

      const inlineScripts = (html.match(/<script(?![^>]*\bsrc\b)[^>]*>/gi) || []);
      const scriptsWithNonce = inlineScripts.filter(s => /nonce=/i.test(s));
      const scriptsWithoutNonce = inlineScripts.length - scriptsWithNonce.length;
      if (scriptsWithoutNonce > 0) {
        findings.push({ field: 'Inline Scripts', status: '⚠️ Found', risk: 'Medium', detail: `${scriptsWithoutNonce} inline script(s) without nonce attribute` });
        riskScore += 10;
      } else if (inlineScripts.length > 0) {
        findings.push({ field: 'Inline Scripts', status: '✅ Protected', risk: 'Low', detail: `All ${inlineScripts.length} inline scripts have nonce` });
      } else {
        findings.push({ field: 'Inline Scripts', status: '✅ None', risk: 'Low', detail: 'No inline scripts detected' });
      }

      const forms = html.match(/<form[^>]*>/gi) || [];
      const formsWithoutEnctype = forms.filter(f => !/enctype=/i.test(f));
      if (forms.length > 0 && formsWithoutEnctype.length > 0) {
        findings.push({ field: 'Form Encoding', status: '⚠️ Missing', risk: 'Low', detail: `${formsWithoutEnctype.length}/${forms.length} form(s) without explicit enctype` });
        riskScore += 5;
      } else if (forms.length > 0) {
        findings.push({ field: 'Form Encoding', status: '✅ Set', risk: 'Low', detail: `All ${forms.length} form(s) have enctype` });
      } else {
        findings.push({ field: 'Form Encoding', status: 'ℹ️ N/A', risk: 'None', detail: 'No forms found on page' });
      }

      const eventHandlers = (html.match(/\bon\w+\s*=\s*["'][^"']*["']/gi) || []).length;
      if (eventHandlers > 0) {
        findings.push({ field: 'Inline Event Handlers', status: '⚠️ Found', risk: 'Medium', detail: `${eventHandlers} inline event handler(s) detected (onclick, onerror, etc.)` });
        riskScore += 10;
      } else {
        findings.push({ field: 'Inline Event Handlers', status: '✅ None', risk: 'Low', detail: 'No inline event handlers detected' });
      }

      const urlObj = new URL(target);
      if (urlObj.search) {
        const paramValues = [...urlObj.searchParams.values()];
        const reflected = paramValues.filter(v => v.length > 2 && html.includes(v));
        if (reflected.length > 0) {
          findings.push({ field: 'URL Param Reflection', status: '⚠️ Reflected', risk: 'High', detail: `${reflected.length} URL parameter value(s) reflected in HTML` });
          riskScore += 20;
        } else {
          findings.push({ field: 'URL Param Reflection', status: '✅ Not reflected', risk: 'Low', detail: 'URL parameters not reflected in page' });
        }
      }

      riskScore = Math.min(riskScore, 100);
      let riskLevel = riskScore >= 60 ? '🔴 HIGH' : riskScore >= 30 ? '🟡 MEDIUM' : '🟢 LOW';

      let result = `╭─⌈ 🛡️ *XSS VULNERABILITY CHECK* ⌋\n│\n`;
      result += `├─⊷ *Target:* ${target}\n`;
      result += `├─⊷ *Status Code:* ${response.status}\n`;
      result += `├─⊷ *Risk Score:* ${riskScore}/100 (${riskLevel})\n│\n`;
      result += `├─⌈ 📋 *FINDINGS* ⌋\n│\n`;

      for (const f of findings) {
        result += `├─⊷ *${f.field}:* ${f.status}\n`;
        result += `│  └⊷ Risk: ${f.risk} — ${f.detail}\n│\n`;
      }

      result += `├─⌈ 💡 *RECOMMENDATIONS* ⌋\n│\n`;
      if (!csp) result += `├─⊷ Implement Content-Security-Policy header\n`;
      if (!xssProtection) result += `├─⊷ Add X-XSS-Protection: 1; mode=block\n`;
      if (scriptsWithoutNonce > 0) result += `├─⊷ Add nonce attributes to inline scripts\n`;
      if (riskScore < 10) result += `├─⊷ Good security posture detected!\n`;
      result += `│\n╰───────────────\n> *WOLFBOT*`;

      await sock.sendMessage(jid, { text: result }, { quoted: m });
      await sock.sendMessage(jid, { react: { text: '✅', key: m.key } });
    } catch (err) {
      await sock.sendMessage(jid, { react: { text: '❌', key: m.key } });
      await sock.sendMessage(jid, { text: `❌ Error: ${err.message}` }, { quoted: m });
    }
  }
};

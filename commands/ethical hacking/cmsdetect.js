import axios from 'axios';

export default {
  name: 'cmsdetect',
  alias: ['cms', 'whatcms'],
  description: 'Detect CMS (Content Management System) of a website',
  category: 'ethical hacking',
  usage: 'cmsdetect <url>',
  async execute(sock, m, args, PREFIX) {
    const jid = m.key.remoteJid;
    if (!args[0]) {
      return sock.sendMessage(jid, { text: `╭─⌈ 🔎 *CMS DETECTOR* ⌋\n│\n├─⊷ *${PREFIX}cmsdetect <url>*\n│  └⊷ Detect website CMS\n│\n├─⊷ *Example:*\n│  └⊷ ${PREFIX}cmsdetect wordpress.org\n╰───────────────\n> *WOLFBOT*` }, { quoted: m });
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

      const html = (res.data || '').toString().toLowerCase();
      const h = res.headers;
      const allHeaders = JSON.stringify(h).toLowerCase();

      const generatorMatch = html.match(/<meta[^>]*name=["']generator["'][^>]*content=["']([^"']+)["']/i);
      const generator = generatorMatch ? generatorMatch[1] : '';

      const signatures = [
        { name: 'WordPress', checks: [html.includes('wp-content'), html.includes('wp-includes'), html.includes('wp-json'), generator.toLowerCase().includes('wordpress'), allHeaders.includes('x-powered-by: wp')], icon: '📝' },
        { name: 'Joomla', checks: [html.includes('/media/jui/'), html.includes('joomla'), html.includes('/components/com_'), generator.toLowerCase().includes('joomla')], icon: '🟠' },
        { name: 'Drupal', checks: [html.includes('drupal'), html.includes('sites/default/files'), html.includes('drupal.js'), h['x-drupal-cache'] !== undefined, h['x-generator']?.toLowerCase().includes('drupal')], icon: '💧' },
        { name: 'Shopify', checks: [html.includes('cdn.shopify.com'), html.includes('shopify'), h['x-shopid'] !== undefined, html.includes('myshopify.com')], icon: '🛒' },
        { name: 'Wix', checks: [html.includes('wix.com'), html.includes('x-wix'), html.includes('_wix'), allHeaders.includes('wix')], icon: '🎨' },
        { name: 'Squarespace', checks: [html.includes('squarespace'), html.includes('static.squarespace'), generator.toLowerCase().includes('squarespace')], icon: '⬛' },
        { name: 'Ghost', checks: [html.includes('ghost.org'), html.includes('ghost-'), generator.toLowerCase().includes('ghost')], icon: '👻' },
        { name: 'Magento', checks: [html.includes('magento'), html.includes('mage/'), html.includes('/skin/frontend/'), allHeaders.includes('magento')], icon: '🛍️' },
        { name: 'PrestaShop', checks: [html.includes('prestashop'), html.includes('/modules/prestashop'), generator.toLowerCase().includes('prestashop')], icon: '🏪' },
        { name: 'Webflow', checks: [html.includes('webflow'), html.includes('wf-'), generator.toLowerCase().includes('webflow')], icon: '🌊' },
        { name: 'Hugo', checks: [generator.toLowerCase().includes('hugo'), html.includes('hugo-')], icon: '📐' },
        { name: 'Next.js', checks: [html.includes('__next'), html.includes('_next/static'), h['x-powered-by']?.toLowerCase().includes('next.js')], icon: '▲' },
        { name: 'Gatsby', checks: [html.includes('gatsby'), html.includes('___gatsby')], icon: '💜' },
        { name: 'Laravel', checks: [allHeaders.includes('laravel'), html.includes('laravel')], icon: '🔴' }
      ];

      const detected = [];
      for (const cms of signatures) {
        const matchCount = cms.checks.filter(Boolean).length;
        if (matchCount > 0) {
          detected.push({ ...cms, confidence: Math.min(100, matchCount * 35) });
        }
      }

      detected.sort((a, b) => b.confidence - a.confidence);

      let output = `╭─⌈ 🔎 *CMS DETECTION RESULTS* ⌋\n│\n├─⊷ *Target:* ${target}\n├─⊷ *Status:* ${res.status}\n│\n`;

      if (generator) {
        output += `├─⊷ 🏷️ *Meta Generator:*\n│  └⊷ ${generator}\n│\n`;
      }

      if (detected.length > 0) {
        output += `├─⊷ 🎯 *CMS Detected:*\n`;
        detected.forEach(cms => {
          output += `│  └⊷ ${cms.icon} ${cms.name} (${cms.confidence}% confidence)\n`;
        });
        output += `│\n`;
      } else {
        output += `├─⊷ ⚠️ *No CMS detected*\n│  └⊷ Custom-built or unrecognized CMS\n│\n`;
      }

      if (h['server']) output += `├─⊷ *Server:* ${h['server']}\n│\n`;
      if (h['x-powered-by']) output += `├─⊷ *X-Powered-By:* ${h['x-powered-by']}\n│\n`;

      output += `╰───────────────\n> *WOLFBOT*`;

      await sock.sendMessage(jid, { text: output }, { quoted: m });
      await sock.sendMessage(jid, { react: { text: '✅', key: m.key } });
    } catch (err) {
      await sock.sendMessage(jid, { react: { text: '❌', key: m.key } });
      await sock.sendMessage(jid, { text: `❌ Error: ${err.message}` }, { quoted: m });
    }
  }
};

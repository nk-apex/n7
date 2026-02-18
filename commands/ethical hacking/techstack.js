import axios from 'axios';

export default {
  name: 'techstack',
  alias: ['tech', 'stackdetect'],
  description: 'Detect technology stack of a website',
  category: 'ethical hacking',
  usage: 'techstack <url>',
  async execute(sock, m, args, PREFIX) {
    const jid = m.key.remoteJid;
    if (!args[0]) {
      return sock.sendMessage(jid, { text: `╭─⌈ ⚙️ *TECH STACK DETECTOR* ⌋\n│\n├─⊷ *${PREFIX}techstack <url>*\n│  └⊷ Detect website technology stack\n│\n├─⊷ *Example:*\n│  └⊷ ${PREFIX}techstack github.com\n╰───────────────\n> *WOLFBOT*` }, { quoted: m });
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

      const html = (res.data || '').toString();
      const htmlLower = html.toLowerCase();
      const h = res.headers;

      const serverInfo = [];
      if (h['server']) serverInfo.push({ cat: 'Server', val: h['server'] });
      if (h['x-powered-by']) serverInfo.push({ cat: 'Backend', val: h['x-powered-by'] });

      const jsLibs = [
        { name: 'jQuery', pattern: /jquery[.-]?\d|jquery\.min\.js/i },
        { name: 'React', pattern: /react\.production|react-dom|reactjs|__NEXT_DATA__/i },
        { name: 'Vue.js', pattern: /vue\.min\.js|vue\.js|vue@|v-cloak|__vue/i },
        { name: 'Angular', pattern: /angular\.min\.js|ng-app|ng-controller|angular\.io/i },
        { name: 'Svelte', pattern: /svelte/i },
        { name: 'Bootstrap', pattern: /bootstrap\.min\.(js|css)|bootstrap@/i },
        { name: 'Tailwind CSS', pattern: /tailwindcss|tailwind\.min\.css/i },
        { name: 'Font Awesome', pattern: /font-?awesome|fontawesome/i },
        { name: 'Lodash', pattern: /lodash\.min\.js|lodash@/i },
        { name: 'Moment.js', pattern: /moment\.min\.js|moment@/i },
        { name: 'Alpine.js', pattern: /alpine\.min\.js|x-data|alpinejs/i },
        { name: 'HTMX', pattern: /htmx\.min\.js|htmx\.org/i },
        { name: 'Three.js', pattern: /three\.min\.js|threejs/i },
        { name: 'GSAP', pattern: /gsap\.min\.js|greensock/i },
        { name: 'Axios', pattern: /axios\.min\.js|axios@/i }
      ];

      const analytics = [
        { name: 'Google Analytics', pattern: /google-analytics\.com|googletagmanager|gtag|ga\.js|analytics\.js/i },
        { name: 'Google Tag Manager', pattern: /googletagmanager\.com\/gtm/i },
        { name: 'Facebook Pixel', pattern: /connect\.facebook\.net|fbq\(|fbevents/i },
        { name: 'Hotjar', pattern: /hotjar\.com|hjSetting/i },
        { name: 'Mixpanel', pattern: /mixpanel\.com|mixpanel\.init/i },
        { name: 'Segment', pattern: /segment\.com|analytics\.load/i },
        { name: 'Clarity', pattern: /clarity\.ms/i }
      ];

      const cdns = [
        { name: 'Cloudflare CDN', pattern: /cdnjs\.cloudflare\.com/i },
        { name: 'jsDelivr', pattern: /cdn\.jsdelivr\.net/i },
        { name: 'unpkg', pattern: /unpkg\.com/i },
        { name: 'Google CDN', pattern: /ajax\.googleapis\.com/i },
        { name: 'AWS CloudFront', pattern: /cloudfront\.net/i },
        { name: 'Akamai CDN', pattern: /akamaized\.net|akamai/i },
        { name: 'Fastly', pattern: /fastly\.net/i }
      ];

      const detectedLibs = jsLibs.filter(l => l.pattern.test(html)).map(l => l.name);
      const detectedAnalytics = analytics.filter(a => a.pattern.test(html)).map(a => a.name);
      const detectedCDNs = cdns.filter(c => c.pattern.test(html)).map(c => c.name);

      const generatorMatch = html.match(/<meta[^>]*name=["']generator["'][^>]*content=["']([^"']+)["']/i);
      const charsetMatch = html.match(/<meta[^>]*charset=["']?([^"'\s>]+)/i);
      const viewportMatch = html.match(/<meta[^>]*name=["']viewport["']/i);

      let output = `╭─⌈ ⚙️ *TECH STACK ANALYSIS* ⌋\n│\n├─⊷ *Target:* ${target}\n├─⊷ *Status:* ${res.status}\n│\n`;

      if (serverInfo.length > 0) {
        output += `├─⊷ 🖥️ *Server Info:*\n`;
        serverInfo.forEach(s => { output += `│  └⊷ ${s.cat}: ${s.val}\n`; });
        output += `│\n`;
      }

      if (generatorMatch) {
        output += `├─⊷ 🏷️ *Generator:* ${generatorMatch[1]}\n│\n`;
      }

      if (detectedLibs.length > 0) {
        output += `├─⊷ 📚 *JS Frameworks/Libraries:*\n`;
        detectedLibs.forEach(l => { output += `│  └⊷ ${l}\n`; });
        output += `│\n`;
      }

      if (detectedAnalytics.length > 0) {
        output += `├─⊷ 📊 *Analytics & Tracking:*\n`;
        detectedAnalytics.forEach(a => { output += `│  └⊷ ${a}\n`; });
        output += `│\n`;
      }

      if (detectedCDNs.length > 0) {
        output += `├─⊷ 🌐 *CDNs:*\n`;
        detectedCDNs.forEach(c => { output += `│  └⊷ ${c}\n`; });
        output += `│\n`;
      }

      output += `├─⊷ 📋 *Page Info:*\n`;
      if (charsetMatch) output += `│  └⊷ Charset: ${charsetMatch[1]}\n`;
      output += `│  └⊷ Viewport: ${viewportMatch ? '✅ Responsive' : '❌ Not set'}\n`;
      output += `│  └⊷ HTTPS: ${target.startsWith('https') ? '✅' : '❌'}\n`;
      output += `│\n`;

      const totalDetected = detectedLibs.length + detectedAnalytics.length + detectedCDNs.length + serverInfo.length;
      output += `├─⊷ 📦 *Total Technologies:* ${totalDetected}\n│\n`;

      output += `╰───────────────\n> *WOLFBOT*`;

      await sock.sendMessage(jid, { text: output }, { quoted: m });
      await sock.sendMessage(jid, { react: { text: '✅', key: m.key } });
    } catch (err) {
      await sock.sendMessage(jid, { react: { text: '❌', key: m.key } });
      await sock.sendMessage(jid, { text: `❌ Error: ${err.message}` }, { quoted: m });
    }
  }
};

import axios from 'axios';

export default {
  name: 'latency',
  alias: ['lat', 'responsetime'],
  description: 'Check website latency and response time',
  category: 'ethical hacking',
  usage: 'latency <url>',
  async execute(sock, m, args, PREFIX) {
    const jid = m.key.remoteJid;
    if (!args[0]) {
      return sock.sendMessage(jid, { text: `╭─⌈ ⏱️ *LATENCY CHECK* ⌋\n│\n├─⊷ *${PREFIX}latency <url>*\n│  └⊷ Check website response time\n│\n├─⊷ *Example:*\n│  └⊷ ${PREFIX}latency google.com\n│  └⊷ ${PREFIX}latency https://example.com\n│\n╰───────────────\n> *WOLFBOT*` }, { quoted: m });
    }
    await sock.sendMessage(jid, { react: { text: '⏳', key: m.key } });
    try {
      let target = args[0];
      if (!target.startsWith('http://') && !target.startsWith('https://')) {
        target = `https://${target}`;
      }

      const results = [];

      for (let i = 0; i < 3; i++) {
        const dnsStart = Date.now();
        try {
          const response = await axios.head(target, {
            timeout: 15000,
            validateStatus: () => true,
            maxRedirects: 5
          });
          const totalTime = Date.now() - dnsStart;
          results.push({
            attempt: i + 1,
            statusCode: response.status,
            totalTime,
            headers: response.headers
          });
        } catch (headErr) {
          const response = await axios.get(target, {
            timeout: 15000,
            validateStatus: () => true,
            maxRedirects: 5
          });
          const totalTime = Date.now() - dnsStart;
          results.push({
            attempt: i + 1,
            statusCode: response.status,
            totalTime,
            headers: response.headers
          });
        }
      }

      const times = results.map(r => r.totalTime);
      const avgTime = Math.round(times.reduce((a, b) => a + b, 0) / times.length);
      const minTime = Math.min(...times);
      const maxTime = Math.max(...times);
      const jitter = maxTime - minTime;

      const lastHeaders = results[results.length - 1].headers;
      const server = lastHeaders['server'] || 'Unknown';
      const contentType = lastHeaders['content-type'] || 'Unknown';

      let rating = '🟢 Excellent';
      if (avgTime > 1000) rating = '🔴 Poor';
      else if (avgTime > 500) rating = '🟠 Fair';
      else if (avgTime > 200) rating = '🟡 Good';

      const result = `╭─⌈ ⏱️ *LATENCY CHECK RESULTS* ⌋\n│\n├─⊷ *Target:* ${target}\n├─⊷ *Status:* ${results[0].statusCode}\n├─⊷ *Rating:* ${rating}\n│\n├─⊷ *── Response Times ──*\n├─⊷ *Request 1:* ${results[0].totalTime}ms\n├─⊷ *Request 2:* ${results[1].totalTime}ms\n├─⊷ *Request 3:* ${results[2].totalTime}ms\n│\n├─⊷ *── Statistics ──*\n├─⊷ *Average:* ${avgTime}ms\n├─⊷ *Minimum:* ${minTime}ms\n├─⊷ *Maximum:* ${maxTime}ms\n├─⊷ *Jitter:* ${jitter}ms\n│\n├─⊷ *── Server Info ──*\n├─⊷ *Server:* ${server}\n├─⊷ *Content-Type:* ${contentType}\n│\n╰───────────────\n> *WOLFBOT*`;

      await sock.sendMessage(jid, { text: result }, { quoted: m });
      await sock.sendMessage(jid, { react: { text: '✅', key: m.key } });
    } catch (err) {
      await sock.sendMessage(jid, { react: { text: '❌', key: m.key } });
      await sock.sendMessage(jid, { text: `❌ Error: ${err.message}` }, { quoted: m });
    }
  }
};

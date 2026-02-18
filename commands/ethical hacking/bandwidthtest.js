import axios from 'axios';

export default {
  name: 'bandwidthtest',
  alias: ['speedtest', 'bandwidth'],
  description: 'Test download speed using Cloudflare speed test',
  category: 'ethical hacking',
  usage: 'bandwidthtest',
  async execute(sock, m, args, PREFIX) {
    const jid = m.key.remoteJid;
    await sock.sendMessage(jid, { react: { text: '⏳', key: m.key } });
    try {
      const testUrl = 'https://speed.cloudflare.com/__down?bytes=1000000';
      const fileSize = 1000000;

      const results = [];

      for (let i = 0; i < 3; i++) {
        const startTime = Date.now();
        const response = await axios.get(testUrl, {
          timeout: 30000,
          responseType: 'arraybuffer'
        });
        const endTime = Date.now();
        const duration = (endTime - startTime) / 1000;
        const bytesReceived = response.data.byteLength || fileSize;
        const speedBps = bytesReceived / duration;
        const speedMbps = (speedBps * 8) / (1024 * 1024);

        results.push({
          attempt: i + 1,
          duration: duration.toFixed(2),
          bytesReceived,
          speedMbps: speedMbps.toFixed(2)
        });
      }

      const speeds = results.map(r => parseFloat(r.speedMbps));
      const avgSpeed = (speeds.reduce((a, b) => a + b, 0) / speeds.length).toFixed(2);
      const maxSpeed = Math.max(...speeds).toFixed(2);
      const minSpeed = Math.min(...speeds).toFixed(2);

      const avgDuration = (results.map(r => parseFloat(r.duration)).reduce((a, b) => a + b, 0) / results.length).toFixed(2);

      let rating = '🟢 Excellent';
      if (avgSpeed < 1) rating = '🔴 Very Slow';
      else if (avgSpeed < 5) rating = '🟠 Slow';
      else if (avgSpeed < 20) rating = '🟡 Moderate';
      else if (avgSpeed < 50) rating = '🟢 Good';

      const fileSizeMB = (fileSize / (1024 * 1024)).toFixed(2);

      const testDetails = results.map(r =>
        `├─⊷ *Test ${r.attempt}:* ${r.speedMbps} Mbps (${r.duration}s)`
      ).join('\n');

      const result = `╭─⌈ 📶 *BANDWIDTH / SPEED TEST* ⌋\n│\n├─⊷ *Test Server:* Cloudflare\n├─⊷ *File Size:* ${fileSizeMB} MB\n├─⊷ *Rating:* ${rating}\n│\n├─⊷ *── Test Results ──*\n${testDetails}\n│\n├─⊷ *── Statistics ──*\n├─⊷ *Average Speed:* ${avgSpeed} Mbps\n├─⊷ *Max Speed:* ${maxSpeed} Mbps\n├─⊷ *Min Speed:* ${minSpeed} Mbps\n├─⊷ *Avg Duration:* ${avgDuration}s\n│\n├─⊷ *── Estimates ──*\n├─⊷ *10 MB file:* ~${(10 / (avgSpeed / 8)).toFixed(1)}s\n├─⊷ *100 MB file:* ~${(100 / (avgSpeed / 8)).toFixed(1)}s\n├─⊷ *1 GB file:* ~${(1024 / (avgSpeed / 8)).toFixed(0)}s\n│\n╰───────────────\n> *WOLFBOT*`;

      await sock.sendMessage(jid, { text: result }, { quoted: m });
      await sock.sendMessage(jid, { react: { text: '✅', key: m.key } });
    } catch (err) {
      await sock.sendMessage(jid, { react: { text: '❌', key: m.key } });
      await sock.sendMessage(jid, { text: `❌ Error: ${err.message}` }, { quoted: m });
    }
  }
};

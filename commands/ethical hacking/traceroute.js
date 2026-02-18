import axios from 'axios';

export default {
  name: 'traceroute',
  alias: ['trace', 'mtr'],
  description: 'Traceroute to a target host',
  category: 'ethical hacking',
  usage: 'traceroute <ip or domain>',
  async execute(sock, m, args, PREFIX) {
    const jid = m.key.remoteJid;
    if (!args[0]) {
      return sock.sendMessage(jid, { text: `╭─⌈ 🛤️ *TRACEROUTE* ⌋\n│\n├─⊷ *${PREFIX}traceroute <ip or domain>*\n│  └⊷ Trace the network path to a host\n│\n├─⊷ *Example:*\n│  └⊷ ${PREFIX}traceroute google.com\n│  └⊷ ${PREFIX}traceroute 8.8.8.8\n│\n╰───────────────\n> *WOLFBOT*` }, { quoted: m });
    }
    await sock.sendMessage(jid, { react: { text: '⏳', key: m.key } });
    try {
      const target = args[0].replace(/^https?:\/\//, '').replace(/\/.*$/, '');
      const { data } = await axios.get(`https://api.hackertarget.com/mtr/?q=${encodeURIComponent(target)}`, { timeout: 30000 });

      const responseText = typeof data === 'string' ? data.trim() : String(data).trim();

      if (responseText.includes('error') || responseText.includes('API count exceeded') || !responseText) {
        throw new Error(responseText || 'No results returned');
      }

      const lines = responseText.split('\n').filter(l => l.trim());

      let result = `╭─⌈ 🛤️ *TRACEROUTE* ⌋\n│\n`;
      result += `├─⊷ *Target:* ${target}\n│\n`;
      result += `├─⊷ *Route:*\n`;

      lines.slice(0, 30).forEach(line => {
        result += `│  └⊷ ${line.trim()}\n`;
      });

      if (lines.length > 30) {
        result += `│  └⊷ ... ${lines.length - 30} more hops\n`;
      }

      result += `│\n├─⊷ *Total Hops:* ${lines.length}\n`;
      result += `│\n╰───────────────\n> *WOLFBOT*`;

      await sock.sendMessage(jid, { text: result }, { quoted: m });
      await sock.sendMessage(jid, { react: { text: '✅', key: m.key } });
    } catch (err) {
      await sock.sendMessage(jid, { react: { text: '❌', key: m.key } });
      await sock.sendMessage(jid, { text: `❌ Error: ${err.message}` }, { quoted: m });
    }
  }
};

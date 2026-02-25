export default {
  name: "up",
  description: "Check bot uptime",

  async execute(sock, m) {
    const jid = m.key.remoteJid;

    const uptime = process.uptime();
    const days = Math.floor(uptime / (3600 * 24));
    const hours = Math.floor((uptime % (3600 * 24)) / 3600);
    const minutes = Math.floor((uptime % 3600) / 60);
    const seconds = Math.floor(uptime % 60);

    let uptimeStr = '';
    if (days > 0) uptimeStr += `${days}d `;
    uptimeStr += `${hours}h ${minutes}m ${seconds}s`;

    await sock.sendMessage(jid, {
      text: `⏱️ *Uptime:* ${uptimeStr}`
    }, { quoted: m });
  },
};

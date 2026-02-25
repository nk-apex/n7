export default {
  name: "p",
  description: "Check bot ping",

  async execute(sock, m) {
    const jid = m.key.remoteJid;
    const start = Date.now();

    const sent = await sock.sendMessage(jid, { text: "Pinging..." }, { quoted: m });
    const ping = Date.now() - start;

    await sock.sendMessage(jid, {
      text: `🏓 *Pong!*\n⏱️ ${ping}ms`,
      edit: sent.key
    });
  },
};

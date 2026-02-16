import moment from 'moment-timezone';

export default {
  name: 'alive',
  description: 'Check if bot is running',
  category: 'utility',

  async execute(sock, m, args, PREFIX) {
    try {
      const jid = m.key.remoteJid;

      function createFakeContact(message) {
        return {
          key: {
            participant: "0@s.whatsapp.net",
            remoteJid: "status@broadcast",
            fromMe: false,
            id: "WOLFBOT"
          },
          messageTimestamp: moment().unix(),
          pushName: "WolfBot",
          message: {
            contactMessage: {
              vcard: `BEGIN:VCARD\nVERSION:3.0\nN:Sy;Bot;;;\nFN:WOLFBOT\nitem1.TEL;waid=${message.key.participant?.split('@')[0] || message.key.remoteJid.split('@')[0]}:${message.key.participant?.split('@')[0] || message.key.remoteJid.split('@')[0]}\nitem1.X-ABLabel:Ponsel\nEND:VCARD`
            }
          },
          participant: "0@s.whatsapp.net"
        };
      }

      const fkontak = createFakeContact(m);

      const uptime = process.uptime();
      const hours = Math.floor(uptime / 3600);
      const minutes = Math.floor((uptime % 3600) / 60);
      const seconds = Math.floor(uptime % 60);

      const usedMemory = process.memoryUsage().heapUsed / 1024 / 1024;
      const totalMemory = process.memoryUsage().heapTotal / 1024 / 1024;
      const memoryPercent = ((usedMemory / totalMemory) * 100).toFixed(1);
      const statusEmoji = memoryPercent < 60 ? "🟢" : memoryPercent < 80 ? "🟡" : "🔴";

      const aliveText = `
╭━「 *WOLFBOT ALIVE* 」━╮
│  ${statusEmoji} *Status:* Online
│  ⏱️ *Uptime:* ${hours}h ${minutes}m ${seconds}s
│  💾 *Memory:* ${memoryPercent}%
╰━━━━━━━━━━━━━╯
_🐺 The pack survives together..._
`;

      await sock.sendMessage(jid, {
        text: aliveText
      }, {
        quoted: fkontak
      });

      await sock.sendMessage(jid, {
        react: { text: '🐺', key: m.key }
      });

    } catch (error) {
      console.error("Alive command error:", error);

      await sock.sendMessage(m.key.remoteJid, {
        text: `🐺 WolfBot is alive!\n⚡ Status: Running`
      }, {
        quoted: m
      });
    }
  }
};

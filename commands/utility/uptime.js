export default {
  name: 'uptime',
  aliases: ['up', 'runtime', 'online'],
  description: 'Check how long WolfBot has been running',
  category: 'utility',

  async execute(sock, m, args, PREFIX) {
    try {
      // Fake contact function
      function createFakeContact(message) {
        return {
          key: {
            participants: "0@s.whatsapp.net",
            remoteJid: "status@broadcast",
            fromMe: false,
            id: "WOLFBOT"
          },
          message: {
            contactMessage: {
              vcard: `BEGIN:VCARD\nVERSION:3.0\nN:Sy;Bot;;;\nFN:WOLFBOT\nitem1.TEL;waid=${message.key.participant?.split('@')[0] || message.key.remoteJid.split('@')[0]}:${message.key.participant?.split('@')[0] || message.key.remoteJid.split('@')[0]}\nitem1.X-ABLabel:Ponsel\nEND:VCARD`
            }
          },
          participant: "0@s.whatsapp.net"
        };
      }

      const fkontak = createFakeContact(m);
      
      const uptime = process.uptime(); // uptime in seconds
      const days = Math.floor(uptime / (3600 * 24));
      const hours = Math.floor((uptime % (3600 * 24)) / 3600);
      const minutes = Math.floor((uptime % 3600) / 60);
      const seconds = Math.floor(uptime % 60);

      // Build time string
      let timeString = "";
      if (days > 0) timeString += `${days} days, `;
      if (hours > 0) timeString += `${hours} hours, `;
      if (minutes > 0) timeString += `${minutes} minutes, `;
      timeString += `${seconds} seconds`;

      // Simple message
          const msg = `
╭━ *WOLFBOT UPTIME* ⏱️━╮
┃  🐺 *Running for:*
┃  ⏱️ ${timeString}
╰━━━━━━━━━━━━━━━━╯
_🐺 The Wolf never sleeps..._
`;


      await sock.sendMessage(m.key.remoteJid, { 
        text: msg 
      }, { 
        quoted: fkontak 
      });

    } catch (error) {
      console.error("Uptime command error:", error);
      
      // Fallback
      const uptime = process.uptime();
      const hours = Math.floor(uptime / 3600);
      const minutes = Math.floor((uptime % 3600) / 60);
      
      await sock.sendMessage(m.key.remoteJid, { 
        text: `🐺 WolfBot: ${hours}h ${minutes}m` 
      }, { 
        quoted: m 
      });
    }
  }
};

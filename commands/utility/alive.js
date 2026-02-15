export default {
  name: 'alive',
  description: 'Check if bot is running',
  category: 'utility',
 // aliases: ['status', 'info', 'bot'],
  
  async execute(sock, m, args, PREFIX) {
    try {
      const jid = m.key.remoteJid;
      const sender = m.key.participant || m.key.remoteJid;
      
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
      
      // Bot information
      const botName = "WolfBot";
      const version = "v2.0.1";
      const creator = "7silent-wolf"; // Updated
      const prefix = PREFIX || ".";
      
      // System status
      const uptime = process.uptime();
      const hours = Math.floor(uptime / 3600);
      const minutes = Math.floor((uptime % 3600) / 60);
      const seconds = Math.floor(uptime % 60);
      
      // Platform info
      const platform = process.platform;
      const nodeVersion = process.version;
      
      // Memory usage
      const usedMemory = process.memoryUsage().heapUsed / 1024 / 1024;
      const totalMemory = process.memoryUsage().heapTotal / 1024 / 1024;
      const memoryPercent = ((usedMemory / totalMemory) * 100).toFixed(1);
      
      // Determine system health
      let systemStatus, statusEmoji, wolfMood;
      if (memoryPercent < 60 && uptime > 3600) {
        systemStatus = "Optimal";
        statusEmoji = "🟢";
        wolfMood = "🐺 Howling at the moon";
      } else if (memoryPercent < 80) {
        systemStatus = "Stable";
        statusEmoji = "🟡";
        wolfMood = "🌕 Watchful gaze";
      } else {
        systemStatus = "Heavy";
        statusEmoji = "🔴";
        wolfMood = "🌑 Resting in shadows";
      }
      
      // Send alive status directly
      await sock.sendMessage(jid, {
        text: `
╭━*WOLFBOT STATUS* ━╮
┃
┃  🌕 *Name:* ${botName} ${version}
┃  ⚡ *Creator:* ${creator}
┃  🐾 *Prefix:* ${prefix}
┃  ⏱️ *Uptime:* ${hours}h ${minutes}m ${seconds}s
┃  ${statusEmoji} *System:* ${systemStatus} (${memoryPercent}%)
┃  🌲 *Node.js:* ${nodeVersion}
┃  _${wolfMood}_
╰━━━━━━━━━━━━━━━━╯
_🐺 The pack survives together..._
`
      }, { 
        quoted: fkontak 
      });

    } catch (error) {
      console.error("Alive command error:", error);
      
      // Simple fallback
      await sock.sendMessage(m.key.remoteJid, {
        text: `✅ WolfBot is alive!\n⚡ Creator: 7silent-wolf\n🐺 Status: Running`
      }, { 
        quoted: m 
      });
    }
  }
};

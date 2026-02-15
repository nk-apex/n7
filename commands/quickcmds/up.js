import axios from "axios";
import os from "os";

export default {
  name: "up",
  description: "Check bot uptime and system status",

  async execute(sock, m, args, PREFIX) {
    try {
      const jid = m.key.remoteJid;
      const sender = m.key.participant || m.key.remoteJid;

      // Fake contact function - ADDED
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

      const fkontak = createFakeContact(m); // ADDED

      // Get bot uptime first (fast)
      const uptime = process.uptime();
      const days = Math.floor(uptime / (3600 * 24));
      const hours = Math.floor((uptime % (3600 * 24)) / 3600);
      const minutes = Math.floor((uptime % 3600) / 60);
      const seconds = Math.floor(uptime % 60);
      
      // Get memory usage
      const usedMemory = process.memoryUsage().heapUsed / 1024 / 1024;
      const totalMemory = process.memoryUsage().heapTotal / 1024 / 1024;
      const memoryPercent = ((usedMemory / totalMemory) * 100).toFixed(1);
      
      // Get start time
      const startTime = new Date(Date.now() - (uptime * 1000));
      const startTimeFormatted = startTime.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
      
      // Get system info
      const platform = os.platform();
      const arch = os.arch();
      const cpus = os.cpus();
      const cpuCores = cpus.length;
      const cpuModel = cpus[0]?.model || "Unknown";
      
      // Try to get GitHub data (but don't let it block the response)
      let githubAvatar = "https://avatars.githubusercontent.com/u/10639145";
      let githubName = "7silent-wolf";
      let githubUrl = "https://github.com/7silent-wolf/silentwolf.git"; // UPDATED: silentwolf.git
      
      try {
        const { data: githubData } = await axios.get(
          "https://api.github.com/users/7silent-wolf",
          { 
            headers: { 
              "User-Agent": "Silent-Wolf-Bot",
              "Accept": "application/vnd.github.v3+json"
            },
            timeout: 3000 // 3 second timeout
          }
        );
        githubAvatar = githubData.avatar_url;
        githubName = githubData.name || "7silent-wolf";
        githubUrl = "https://github.com/7silent-wolf/silentwolf.git"; // UPDATED: silentwolf.git
      } catch (githubErr) {
        console.log("GitHub API failed, using defaults");
      }
      
      // UPDATED: Added borders to the text
      const text = `
`.trim();

      await sock.sendMessage(
        jid,
        {
          text,
          contextInfo: {
            mentionedJid: [sender],
            externalAdReply: {
              title: "🐺 Silent Wolf Bot Uptime",
              body: `Uptime: ${days}d ${hours}h ${minutes}m`,
              mediaType: 1,
              thumbnailUrl: githubAvatar,
              sourceUrl: githubUrl, // UPDATED: silentwolf.git
              renderLargerThumbnail: true,
              showAdAttribution: false
            },
          },
        },
        { quoted: fkontak } // UPDATED: Changed from 'm' to 'fkontak'
      );

      console.log(`✅ Uptime command executed - Running for ${days}d ${hours}h ${minutes}m`);

    } catch (err) {
      console.error("❌ Uptime command error:", err.message || err);
      
      // Ultra simple fallback with borders
      const uptime = process.uptime();
      const days = Math.floor(uptime / (3600 * 24));
      const hours = Math.floor((uptime % (3600 * 24)) / 3600);
      const minutes = Math.floor((uptime % 3600) / 60);
      
      const fallbackText = `
╭━━⏱️ *BOT UPTIME* ⏱️━━╮
┃
┃  ⏱️ Uptime: ${days}d ${hours}h ${minutes}m
┃  👋 @${sender.split("@")[0]}, bot is running!
┃
╰━━━━━━━━━━━━━━━━━━━━╯
`.trim();
      
      await sock.sendMessage(
        m.key.remoteJid,
        { text: fallbackText },
        { quoted: m }
      );
    }
  },
};

import axios from "axios";
import { getBotName } from '../../lib/botname.js';

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

    let githubAvatar = "https://avatars.githubusercontent.com/u/10639145";
    let githubUrl = "https://github.com/7silent-wolf/silentwolf";

    try {
      const { data } = await axios.get("https://api.github.com/users/7silent-wolf", {
        headers: { "User-Agent": "Silent-Wolf-Bot", "Accept": "application/vnd.github.v3+json" },
        timeout: 3000
      });
      githubAvatar = data.avatar_url;
    } catch {}

    function createFakeContact(message) {
      return {
        key: {
          participants: "0@s.whatsapp.net",
          remoteJid: "status@broadcast",
          fromMe: false,
          id: getBotName()
        },
        message: {
          contactMessage: {
            vcard: `BEGIN:VCARD\nVERSION:3.0\nN:Sy;Bot;;;\nFN:${getBotName()}\nitem1.TEL;waid=${message.key.participant?.split('@')[0] || message.key.remoteJid.split('@')[0]}:${message.key.participant?.split('@')[0] || message.key.remoteJid.split('@')[0]}\nitem1.X-ABLabel:Ponsel\nEND:VCARD`
          }
        },
        participant: "0@s.whatsapp.net"
      };
    }

    const fkontak = createFakeContact(m);

    await sock.sendMessage(
      jid,
      {
        text: `⏱️ *Uptime:* ${uptimeStr}`,
        contextInfo: {
          externalAdReply: {
            title: `🐺 ${getBotName()} Uptime`,
            body: uptimeStr,
            mediaType: 1,
            thumbnailUrl: githubAvatar,
            sourceUrl: githubUrl,
            renderLargerThumbnail: true
          }
        }
      },
      { quoted: fkontak }
    );
  },
};

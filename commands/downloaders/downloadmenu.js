import { sendSubMenu } from '../../lib/menuHelper.js';

export default {
  name: "downloadmenu",
  alias: ["dlmenu", "downloadhelp", "dlcmds"],
  desc: "Shows media download commands",
  category: "Downloaders",
  usage: ".downloadmenu",

  async execute(sock, m) {
    const jid = m.key.remoteJid;

    const commandsText = `╭─⊷ *📱 SOCIAL MEDIA*
│
│  • tiktok
│  • tiktoksearch
│  • tiktokinfo
│  • instagram
│  • facebook
│  • snapchat
│
╰─⊷

╭─⊷ *🎬 YOUTUBE*
│
│  • yts
│  • ytplay
│  • ytmp3
│  • ytv
│  • ytmp4
│  • ytvdoc
│  • playlist
│
╰─⊷

╭─⊷ *📦 OTHER*
│
│  • apk
│  • mp3
│  • mp4
│
╰─⊷`;

    await sendSubMenu(sock, jid, '⬇️ DOWNLOAD MENU', commandsText, m);
  }
};

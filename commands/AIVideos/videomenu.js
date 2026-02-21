import { sendSubMenu } from '../../lib/menuHelper.js';

export default {
  name: "videomenu",
  alias: ["vidmenu", "aividmenu", "videoeffects"],
  desc: "Shows AI video effect commands",
  category: "AIVideos",
  usage: ".videomenu",

  async execute(sock, m) {
    const jid = m.key.remoteJid;

    const commandsText = `╭─⊷ *🎬 AI VIDEO EFFECTS*
│
│  • tigervideo
│  • introvideo
│  • lightningpubg
│  • lovevideo
│  • videogen
│
╰─⊷`;

    await sendSubMenu(sock, jid, '🎬 AI VIDEO EFFECTS MENU', commandsText, m);
  }
};

import { sendSubMenu } from '../../lib/menuHelper.js';

export default {
  name: "musicmenu",
  alias: ["mmenu", "musichelp", "musiccmds"],
  desc: "Shows music and media commands",
  category: "Music",
  usage: ".musicmenu",

  async execute(sock, m) {
    const jid = m.key.remoteJid;

    const commandsText = `╭─⊷ *🎵 MUSIC COMMANDS*
│
│  • play
│  • song
│  • video
│  • videodoc
│  • lyrics
│  • shazam
│  • spotify
│
╰─⊷`;

    await sendSubMenu(sock, jid, '🎵 MUSIC MENU', commandsText, m);
  }
};

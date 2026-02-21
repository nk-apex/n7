import { sendSubMenu } from '../../lib/menuHelper.js';

export default {
  name: "gitmenu",
  alias: ["githubmenu", "gitcmds", "githelp"],
  desc: "Shows GitHub commands",
  category: "GitHub",
  usage: ".gitmenu",

  async execute(sock, m) {
    const jid = m.key.remoteJid;

    const commandsText = `╭─⊷ *🐙 GITHUB COMMANDS*
│
│  • gitclone
│  • gitinfo
│  • repanalyze
│  • zip
│  • update
│  • repo
│
╰─⊷`;

    await sendSubMenu(sock, jid, '🐙 GITHUB MENU', commandsText, m);
  }
};

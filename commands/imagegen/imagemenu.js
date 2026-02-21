import { sendSubMenu } from '../../lib/menuHelper.js';

export default {
  name: "imagemenu",
  alias: ["imgmenu", "imagehelp", "imgcmds"],
  desc: "Shows image generation commands",
  category: "ImageGen",
  usage: ".imagemenu",

  async execute(sock, m) {
    const jid = m.key.remoteJid;

    const commandsText = `╭─⊷ *🖼️ IMAGE GENERATION*
│
│  • image
│  • imagine
│  • imagegen
│  • anime
│  • art
│  • real
│  • remini
│  • vision
│
╰─⊷`;

    await sendSubMenu(sock, jid, '🖼️ IMAGE MENU', commandsText, m);
  }
};

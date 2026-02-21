import { EPHOTO_EFFECTS } from './ephotoUtils.js';

export default {
  name: 'ephotomenu',
  alias: ['ephoto', 'ephotolist', 'ephotoeffects', 'neonmenu'],
  description: 'Shows all available ephoto text effects',
  category: 'ephoto',
  ownerOnly: false,
  usage: 'ephotomenu',

  async execute(sock, msg, args, PREFIX) {
    const chatId = msg.key.remoteJid;

    const effectList = Object.entries(EPHOTO_EFFECTS).map(([key, effect]) => {
      return `│  ${effect.emoji} • ${key}`;
    }).join('\n');

    const menuText = `╭─⌈ ✨ *EPHOTO TEXT EFFECTS* ⌋
│
│  Create stunning neon & glow
│  text effects from your text!
│
├─⊷ *📋 AVAILABLE EFFECTS*
│
${effectList}
│
├─⊷ *💡 HOW TO USE*
│  Type: ${PREFIX}<effect> <your text>
│
├─⊷ *📌 EXAMPLES*
│  └⊷ ${PREFIX}neon WolfBot
│  └⊷ ${PREFIX}galaxyneon Silent Wolf
│  └⊷ ${PREFIX}devilwings MyName
│  └⊷ ${PREFIX}hackerneon Anonymous
│  └⊷ ${PREFIX}neonglitch Hacker
│
├─⊷ *🔢 TOTAL EFFECTS:* ${Object.keys(EPHOTO_EFFECTS).length}
│
╰───────────────
🐺 *POWERED BY WOLFBOT* 🐺`;

    await sock.sendMessage(chatId, {
      text: menuText
    }, { quoted: msg });
  }
};

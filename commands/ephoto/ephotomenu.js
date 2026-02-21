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

    const neonEffects = [];
    const threeDEffects = [];

    for (const [key, effect] of Object.entries(EPHOTO_EFFECTS)) {
      if (effect.apiId) {
        threeDEffects.push(`│  ${effect.emoji} • ${key}`);
      } else {
        neonEffects.push(`│  ${effect.emoji} • ${key}`);
      }
    }

    const menuText = `╭─⌈ ✨ *EPHOTO TEXT EFFECTS* ⌋
│
│  Create stunning text effects
│  from your text!
│
├─⊷ *💡 NEON & GLOW EFFECTS (${neonEffects.length})*
│
${neonEffects.join('\n')}
│
├─⊷ *🧊 3D TEXT EFFECTS (${threeDEffects.length})*
│
${threeDEffects.join('\n')}
│
├─⊷ *💡 HOW TO USE*
│  Type: ${PREFIX}<effect> <your text>
│
├─⊷ *📌 EXAMPLES*
│  └⊷ ${PREFIX}neon WolfBot
│  └⊷ ${PREFIX}galaxyneon Silent Wolf
│  └⊷ ${PREFIX}wooden3d MyName
│  └⊷ ${PREFIX}hologram3d Hacker
│  └⊷ ${PREFIX}avengers3d Hero
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

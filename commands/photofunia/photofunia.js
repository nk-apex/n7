import { EFFECTS, CATEGORY_META, getEffectsByCategory, getAllCategories } from './photofuniaUtils.js';

export default {
  name: 'photofunia',
  description: '🎨 PhotoFunia effects menu - Browse all 154 effects',
  category: 'photofunia',
  alias: ['pf', 'pfx', 'pfmenu', 'pflist', 'photofuniamenu'],

  async execute(sock, m, args, PREFIX) {
    const jid = m.key.remoteJid;

    if (args.length && CATEGORY_META[args[0].toLowerCase()]) {
      const cat = args[0].toLowerCase();
      const effects = getEffectsByCategory(cat);
      const meta = CATEGORY_META[cat];
      let list = '';
      for (const [key, eff] of effects) {
        const cmdName = key.replace(/-/g, '');
        const typeTag = eff.type === 'image' ? '🖼️' : eff.type === 'text' ? '📝' : '🔄';
        list += `│  ${typeTag} ${eff.emoji} ${PREFIX}${cmdName}\n│     └ ${eff.name}\n`;
      }
      const catText = `╭─⌈ ${meta.emoji} *${meta.name.toUpperCase()} EFFECTS* ⌋\n│\n${list}│\n├─⊷ *Legend:* 🖼️ Image | 📝 Text | 🔄 Both\n├─⊷ *Usage:* ${PREFIX}<command> [text]\n│\n╰───────────────\n🐺 *POWERED BY WOLFBOT* 🐺`;
      return await sock.sendMessage(jid, { text: catText }, { quoted: m });
    }

    const cats = getAllCategories();
    const totalEffects = Object.keys(EFFECTS).length;
    const catOrder = Object.keys(CATEGORY_META);

    let fullList = '';
    for (const cat of catOrder) {
      const effects = cats[cat];
      if (!effects || effects.length === 0) continue;
      const meta = CATEGORY_META[cat];

      fullList += `├─⊷ ${meta.emoji} *${meta.name.toUpperCase()}* (${effects.length})\n`;
      for (const eff of effects) {
        const cmdName = eff.key.replace(/-/g, '');
        const typeTag = eff.type === 'image' ? '🖼️' : eff.type === 'text' ? '📝' : '🔄';
        fullList += `│  ${typeTag} ${eff.emoji} *${PREFIX}${cmdName}*\n`;
      }
      fullList += `│\n`;
    }

    const menuText = `╭─⌈ 🎨 *PHOTOFUNIA MENU* ⌋
│
│  Transform your photos and text
│  with *${totalEffects}* stunning effects!
│
│  🖼️ = Reply to image
│  📝 = Text input
│  🔄 = Text + image
│
${fullList}├─⊷ *💡 HOW TO USE*
│  ▸ ${PREFIX}photofunia <category>
│     └ View a single category
│  ▸ Each effect is its own command
│  ▸ Multi-text: use | to separate
│
├─⊷ *📌 EXAMPLES*
│  └⊷ ${PREFIX}smokeflare (reply to img)
│  └⊷ ${PREFIX}einstein Hello World
│  └⊷ ${PREFIX}breakingnews CNN | Title | Info
│  └⊷ ${PREFIX}wanted A | B | Name | $500 | Sheriff
│
├─⊷ *📊 TOTAL:* ${totalEffects} effects
├─⊷ *📂 CATEGORIES:* ${catOrder.length}
│
╰───────────────
🐺 *POWERED BY WOLFBOT* 🐺`;

    await sock.sendMessage(jid, { text: menuText }, { quoted: m });
  }
};

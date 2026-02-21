import { EFFECTS, CATEGORY_META, getEffectsByCategory, getAllCategories } from './photofuniaUtils.js';

export default {
  name: 'photofunia',
  description: '🎨 PhotoFunia effects menu - Browse all effects by category',
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
        list += `│  ${eff.emoji} *${PREFIX}${cmdName}* ${typeTag}\n│     └ ${eff.name}\n`;
      }
      const catText = `╭─⌈ ${meta.emoji} *${meta.name.toUpperCase()} EFFECTS* ⌋\n│\n${list}│\n├─⊷ *Legend:* 🖼️ Image | 📝 Text | 🔄 Both\n├─⊷ *Usage:* ${PREFIX}<command> [text]\n│\n╰───────────────\n🐺 *POWERED BY WOLFBOT* 🐺`;
      return await sock.sendMessage(jid, { text: catText }, { quoted: m });
    }

    const cats = getAllCategories();
    const totalEffects = Object.keys(EFFECTS).length;

    let catList = '';
    for (const [cat, effects] of Object.entries(cats)) {
      const meta = CATEGORY_META[cat] || { emoji: '📁', name: cat };
      const imageCount = effects.filter(e => e.type === 'image').length;
      const textCount = effects.filter(e => e.type === 'text').length;
      const bothCount = effects.filter(e => e.type === 'text+image').length;
      let breakdown = [];
      if (imageCount) breakdown.push(`🖼️${imageCount}`);
      if (textCount) breakdown.push(`📝${textCount}`);
      if (bothCount) breakdown.push(`🔄${bothCount}`);
      catList += `│  ${meta.emoji} *${meta.name}* ─ ${effects.length} effects\n│     └ ${breakdown.join(' • ')}\n`;
    }

    const menuText = `╭─⌈ 🎨 *PHOTOFUNIA MENU* ⌋
│
│  Transform your photos and text
│  with ${totalEffects} stunning effects!
│
├─⊷ *📂 CATEGORIES*
│
${catList}│
├─⊷ *💡 HOW TO USE*
│  ▸ ${PREFIX}photofunia <category>
│     └ View effects in a category
│  ▸ Each effect is its own command
│  ▸ 🖼️ = Reply to image needed
│  ▸ 📝 = Text input needed
│  ▸ 🔄 = Both text + image needed
│
├─⊷ *📌 EXAMPLES*
│  └⊷ ${PREFIX}photofunia halloween
│  └⊷ ${PREFIX}smokeflare (reply to img)
│  └⊷ ${PREFIX}einstein Hello World
│  └⊷ ${PREFIX}breakingnews Text (reply)
│
├─⊷ *📊 TOTAL:* ${totalEffects} effects
├─⊷ *📂 CATEGORIES:* ${Object.keys(cats).length}
│
╰───────────────
🐺 *POWERED BY WOLFBOT* 🐺`;

    await sock.sendMessage(jid, { text: menuText }, { quoted: m });
  }
};

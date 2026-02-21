import { EFFECTS, CATEGORY_META, getAllCategories } from './photofuniaUtils.js';

export default {
  name: 'photofuniamenu',
  description: '📋 Show all PhotoFunia effect categories',
  category: 'photofunia',
  aliases: ['pfmenu', 'pflist'],

  async execute(sock, m, args, PREFIX) {
    const jid = m.key.remoteJid;
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
├─⊷ *💡 QUICK GUIDE*
│  ▸ ${PREFIX}pf <category>
│     └ View effects in a category
│  ▸ ${PREFIX}pf <effect> [text]
│     └ Apply an effect
│  ▸ 🖼️ = Reply to image needed
│  ▸ 📝 = Text input needed
│  ▸ 🔄 = Both text + image needed
│
├─⊷ *📌 EXAMPLES*
│  └⊷ ${PREFIX}pf halloween
│  └⊷ ${PREFIX}pf popart (reply to img)
│  └⊷ ${PREFIX}pf einstein Hello
│  └⊷ ${PREFIX}pf trump Text (reply to img)
│
├─⊷ *📊 TOTAL:* ${totalEffects} effects
├─⊷ *📂 CATEGORIES:* ${Object.keys(cats).length}
│
╰───────────────
🐺 *POWERED BY WOLFBOT* 🐺`;

    await sock.sendMessage(jid, { text: menuText }, { quoted: m });
  }
};

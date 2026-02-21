import axios from 'axios';
import { EFFECTS, CATEGORY_META, generatePhotofunia, getImageUrl, getEffectsByCategory, getAllCategories } from './photofuniaUtils.js';

export default {
  name: 'photofunia',
  description: '🎨 PhotoFunia effects - Apply stunning effects to images and text',
  category: 'photofunia',
  aliases: ['pf', 'pfx'],

  async execute(sock, m, args, PREFIX) {
    const jid = m.key.remoteJid;

    if (!args.length) {
      const cats = getAllCategories();
      let catList = '';
      for (const [cat, effects] of Object.entries(cats)) {
        const meta = CATEGORY_META[cat] || { emoji: '📁', name: cat };
        catList += `│  ${meta.emoji} *${meta.name}* (${effects.length})\n`;
      }
      const totalEffects = Object.keys(EFFECTS).length;
      const helpText = `╭─⌈ 🎨 *PHOTOFUNIA EFFECTS* ⌋
│
│  Apply stunning photo effects
│  to your images and text!
│
├─⊷ *📂 CATEGORIES*
│
${catList}│
├─⊷ *💡 HOW TO USE*
│  ▸ ${PREFIX}pf <effect> [text]
│  ▸ Reply to an image for image effects
│  ▸ ${PREFIX}pf <category> to list effects
│
├─⊷ *📌 EXAMPLES*
│  └⊷ ${PREFIX}pf anime (reply to image)
│  └⊷ ${PREFIX}pf einstein Hello World
│  └⊷ ${PREFIX}pf badges My Text (reply to img)
│  └⊷ ${PREFIX}pf retro-wave Line1|Line2|Line3
│
├─⊷ *📊 TOTAL:* ${totalEffects} effects
│
╰───────────────
🐺 *POWERED BY WOLFBOT* 🐺`;

      return await sock.sendMessage(jid, { text: helpText }, { quoted: m });
    }

    const input = args[0].toLowerCase();

    if (CATEGORY_META[input]) {
      const effects = getEffectsByCategory(input);
      const meta = CATEGORY_META[input];
      let list = '';
      for (const [key, eff] of effects) {
        const typeTag = eff.type === 'image' ? '🖼️' : eff.type === 'text' ? '📝' : '🖼️📝';
        list += `│  ${eff.emoji} *${key}* ${typeTag}\n│     └ ${eff.name}\n`;
      }
      const catText = `╭─⌈ ${meta.emoji} *${meta.name.toUpperCase()} EFFECTS* ⌋
│
${list}│
├─⊷ *Legend:* 🖼️ Image | 📝 Text | 🖼️📝 Both
├─⊷ *Usage:* ${PREFIX}pf <effect> [text]
│
╰───────────────
🐺 *POWERED BY WOLFBOT* 🐺`;

      return await sock.sendMessage(jid, { text: catText }, { quoted: m });
    }

    const effectKey = input;
    const effectData = EFFECTS[effectKey];

    if (!effectData) {
      const suggestions = Object.keys(EFFECTS).filter(k => k.includes(input)).slice(0, 5);
      let msg = `❌ Unknown effect: *${input}*\n\n`;
      if (suggestions.length) {
        msg += `💡 Did you mean:\n${suggestions.map(s => `  ▸ ${s}`).join('\n')}\n\n`;
      }
      msg += `Type *${PREFIX}pf* to see all categories.`;
      return await sock.sendMessage(jid, { text: msg }, { quoted: m });
    }

    await sock.sendMessage(jid, { react: { text: '⏳', key: m.key } });

    try {
      const options = {};
      const textArgs = args.slice(1).join(' ');

      if (effectData.type === 'image') {
        const imageUrl = await getImageUrl(m, sock);
        if (!imageUrl) {
          await sock.sendMessage(jid, { react: { text: '❌', key: m.key } });
          return await sock.sendMessage(jid, {
            text: `╭─⌈ ${effectData.emoji} *${effectData.name}* ⌋\n│\n├─⊷ This effect requires an *image*\n├─⊷ Reply to an image with:\n│  └⊷ ${PREFIX}pf ${effectKey}\n│\n╰───────────────`
          }, { quoted: m });
        }
        options.imageUrl = imageUrl;
      } else if (effectData.type === 'text') {
        if (!textArgs) {
          await sock.sendMessage(jid, { react: { text: '❌', key: m.key } });
          const multiHint = effectData.textParams ? `\n├─⊷ Use | to separate: ${effectData.textParams.join(' | ')}` : '';
          return await sock.sendMessage(jid, {
            text: `╭─⌈ ${effectData.emoji} *${effectData.name}* ⌋\n│\n├─⊷ This effect requires *text*\n├─⊷ Usage: ${PREFIX}pf ${effectKey} <text>${multiHint}\n│\n╰───────────────`
          }, { quoted: m });
        }
        if (effectData.textParams) {
          const parts = textArgs.split('|').map(t => t.trim());
          effectData.textParams.forEach((param, i) => {
            options[param] = parts[i] || parts[0] || textArgs;
          });
        } else {
          options.text = textArgs;
        }
      } else if (effectData.type === 'text+image') {
        const imageUrl = await getImageUrl(m, sock);
        if (!imageUrl) {
          await sock.sendMessage(jid, { react: { text: '❌', key: m.key } });
          return await sock.sendMessage(jid, {
            text: `╭─⌈ ${effectData.emoji} *${effectData.name}* ⌋\n│\n├─⊷ This effect requires *text + image*\n├─⊷ Reply to an image with:\n│  └⊷ ${PREFIX}pf ${effectKey} <your text>\n│\n╰───────────────`
          }, { quoted: m });
        }
        if (!textArgs) {
          await sock.sendMessage(jid, { react: { text: '❌', key: m.key } });
          const multiHint = effectData.textParams ? `\n├─⊷ Use | to separate: ${effectData.textParams.join(' | ')}` : '';
          return await sock.sendMessage(jid, {
            text: `╭─⌈ ${effectData.emoji} *${effectData.name}* ⌋\n│\n├─⊷ This effect requires *text + image*\n├─⊷ Reply to an image with:\n│  └⊷ ${PREFIX}pf ${effectKey} <your text>${multiHint}\n│\n╰───────────────`
          }, { quoted: m });
        }
        options.imageUrl = imageUrl;
        if (effectData.textParams) {
          const parts = textArgs.split('|').map(t => t.trim());
          effectData.textParams.forEach((param, i) => {
            options[param] = parts[i] || parts[0] || textArgs;
          });
        } else {
          options.text = textArgs;
        }
      }

      console.log(`🎨 [PHOTOFUNIA] Processing: ${effectKey} | Type: ${effectData.type}`);
      const resultBuffer = await generatePhotofunia(effectData.effect, options);

      if (!resultBuffer || resultBuffer.length === 0) {
        await sock.sendMessage(jid, { react: { text: '❌', key: m.key } });
        return await sock.sendMessage(jid, {
          text: `❌ Failed to generate *${effectData.name}* effect. Try again later.`
        }, { quoted: m });
      }

      await sock.sendMessage(jid, {
        image: resultBuffer,
        caption: `${effectData.emoji} *${effectData.name}*\n🎨 Effect: ${effectKey}\n\n🐺 *Created by WOLFBOT*`
      }, { quoted: m });

      await sock.sendMessage(jid, { react: { text: '✅', key: m.key } });
      console.log(`✅ [PHOTOFUNIA] Successfully sent: ${effectKey}`);
    } catch (error) {
      console.log(`❌ [PHOTOFUNIA] Error for ${effectKey}:`, error.message);
      await sock.sendMessage(jid, { react: { text: '❌', key: m.key } });
      await sock.sendMessage(jid, {
        text: `❌ Error generating *${effectData.name}*: ${error.message}`
      }, { quoted: m });
    }
  }
};

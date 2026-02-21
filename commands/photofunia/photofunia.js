import { EFFECTS, CATEGORY_META, getEffectsByCategory, getAllCategories } from './photofuniaUtils.js';
import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DEFAULT_MENU_IMAGE_URL = "https://i.ibb.co/Gvkt4q9d/Chat-GPT-Image-Feb-21-2026-12-47-33-AM.png";

let _cachedImage = null;
let _cachedImageTime = 0;
const CACHE_TTL = 10 * 60 * 1000;

async function getMenuImage() {
  const now = Date.now();
  if (_cachedImage && (now - _cachedImageTime < CACHE_TTL)) return _cachedImage;

  const imgPath1 = path.join(__dirname, "../menus/media/wolfbot.jpg");
  const imgPath2 = path.join(__dirname, "../media/wolfbot.jpg");
  const localPath = fs.existsSync(imgPath1) ? imgPath1 : fs.existsSync(imgPath2) ? imgPath2 : null;

  if (localPath) {
    _cachedImage = fs.readFileSync(localPath);
    _cachedImageTime = now;
    return _cachedImage;
  }

  try {
    const res = await axios.get(DEFAULT_MENU_IMAGE_URL, { responseType: 'arraybuffer', timeout: 10000 });
    _cachedImage = Buffer.from(res.data);
    _cachedImageTime = now;
    return _cachedImage;
  } catch {
    return null;
  }
}

export default {
  name: 'photofunia',
  description: 'PhotoFunia effects menu - Browse all 154 effects',
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
        const typeLabel = eff.type === 'image' ? '[img]' : eff.type === 'text' ? '[txt]' : '[both]';
        list += `| ${typeLabel} ${PREFIX}${cmdName}\n|   - ${eff.name}\n`;
      }
      const catText = `*${meta.name.toUpperCase()} EFFECTS*\n\n${list}\n*Legend:* [img] Image | [txt] Text | [both] Both\n*Usage:* ${PREFIX}<command> [text]\n\nPOWERED BY WOLFBOT`;

      const imageBuffer = await getMenuImage();
      if (imageBuffer) {
        return await sock.sendMessage(jid, { image: imageBuffer, caption: catText, mimetype: 'image/jpeg' }, { quoted: m });
      }
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

      fullList += `*${meta.name.toUpperCase()}* (${effects.length})\n`;
      for (const eff of effects) {
        const cmdName = eff.key.replace(/-/g, '');
        const typeLabel = eff.type === 'image' ? '[img]' : eff.type === 'text' ? '[txt]' : '[both]';
        fullList += `| ${typeLabel} *${PREFIX}${cmdName}*\n`;
      }
      fullList += `\n`;
    }

    const menuText = `*PHOTOFUNIA MENU*

Transform your photos and text
with *${totalEffects}* stunning effects!

[img] = Reply to image
[txt] = Text input
[both] = Text + image

${fullList}*HOW TO USE*
${PREFIX}photofunia <category>
  - View a single category
Each effect is its own command
Multi-text: use | to separate

*EXAMPLES*
${PREFIX}smokeflare (reply to img)
${PREFIX}einstein Hello World
${PREFIX}breakingnews CNN | Title | Info
${PREFIX}wanted A | B | Name | $500 | Sheriff

*TOTAL:* ${totalEffects} effects
*CATEGORIES:* ${catOrder.length}

POWERED BY WOLFBOT`;

    const imageBuffer = await getMenuImage();
    if (imageBuffer) {
      await sock.sendMessage(jid, { image: imageBuffer, caption: menuText, mimetype: 'image/jpeg' }, { quoted: m });
    } else {
      await sock.sendMessage(jid, { text: menuText }, { quoted: m });
    }
  }
};

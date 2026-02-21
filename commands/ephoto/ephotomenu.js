import { EPHOTO_EFFECTS } from './ephotoUtils.js';
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
        threeDEffects.push(`| ${key}`);
      } else {
        neonEffects.push(`| ${key}`);
      }
    }

    const menuText = `*EPHOTO TEXT EFFECTS*

Create stunning text effects
from your text!

*NEON & GLOW EFFECTS (${neonEffects.length})*

${neonEffects.join('\n')}

*3D TEXT EFFECTS (${threeDEffects.length})*

${threeDEffects.join('\n')}

*HOW TO USE*
Type: ${PREFIX}<effect> <your text>

*EXAMPLES*
${PREFIX}neon WolfBot
${PREFIX}galaxyneon Silent Wolf
${PREFIX}wooden3d MyName
${PREFIX}hologram3d Hacker
${PREFIX}avengers3d Hero

*TOTAL EFFECTS:* ${Object.keys(EPHOTO_EFFECTS).length}

POWERED BY WOLFBOT`;

    const imageBuffer = await getMenuImage();
    if (imageBuffer) {
      await sock.sendMessage(chatId, {
        image: imageBuffer,
        caption: menuText,
        mimetype: 'image/jpeg'
      }, { quoted: msg });
    } else {
      await sock.sendMessage(chatId, { text: menuText }, { quoted: msg });
    }
  }
};

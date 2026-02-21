import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';
import axios from 'axios';

const DEFAULT_MENU_IMAGE_URL = "https://i.ibb.co/Gvkt4q9d/Chat-GPT-Image-Feb-21-2026-12-47-33-AM.png";

let _cachedImage = null;
let _cachedImageTime = 0;
let _cachedGif = null;
let _cachedGifMp4 = null;
const CACHE_TTL = 10 * 60 * 1000;

export function getBotName() {
  try {
    const possiblePaths = [
      './bot_settings.json',
      path.join(process.cwd(), 'bot_settings.json'),
    ];
    for (const settingsPath of possiblePaths) {
      if (fs.existsSync(settingsPath)) {
        try {
          const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
          if (settings.botName && settings.botName.trim() !== '') {
            return settings.botName.trim();
          }
        } catch {}
      }
    }
    if (global.BOT_NAME) return global.BOT_NAME;
    if (process.env.BOT_NAME) return process.env.BOT_NAME;
  } catch {}
  return 'WOLFBOT';
}

export function createFakeContact(message) {
  const id = message.key.participant?.split('@')[0] || message.key.remoteJid.split('@')[0];
  return {
    key: {
      remoteJid: "status@broadcast",
      fromMe: false,
      id: "WOLF-X"
    },
    message: {
      contactMessage: {
        displayName: "WOLF BOT",
        vcard: `BEGIN:VCARD\nVERSION:3.0\nN:Sy;Bot;;;\nFN:WOLF BOT\nitem1.TEL;waid=${id}:${id}\nitem1.X-ABLabel:Ponsel\nEND:VCARD`
      }
    },
    participant: "0@s.whatsapp.net"
  };
}

export function createFadedEffect(text) {
  const fadeChars = ['\u200D', '\u200C', '\u2060', '\uFEFF'];
  const initialFade = Array.from({ length: 90 }, (_, i) => fadeChars[i % fadeChars.length]).join('');
  return `${initialFade}${text}`;
}

export function createReadMoreEffect(text1, text2) {
  const invisibleChars = ['\u200E', '\u200F', '\u200B', '\u200C', '\u200D', '\u2060', '\uFEFF'];
  const invisibleString = Array.from({ length: 550 }, (_, i) => invisibleChars[i % invisibleChars.length]).join('');
  return `${text1}${invisibleString}\n${text2}`;
}

export async function sendLoadingMessage(sock, jid, menuName, m) {
  const botName = getBotName();
  const fkontak = createFakeContact(m);
  await sock.sendMessage(jid, {
    text: `⚡ ${botName} ${menuName} loading...`
  }, { quoted: fkontak });
  await new Promise(resolve => setTimeout(resolve, 800));
  return fkontak;
}

export function getMenuMedia() {
  const now = Date.now();
  const menusDir = path.join(process.cwd(), 'commands', 'menus', 'media');
  const mediaDir = path.join(process.cwd(), 'commands', 'media');

  const gifPath1 = path.join(menusDir, 'wolfbot.gif');
  const gifPath2 = path.join(mediaDir, 'wolfbot.gif');
  const imgPath1 = path.join(menusDir, 'wolfbot.jpg');
  const imgPath2 = path.join(mediaDir, 'wolfbot.jpg');

  const gifPath = fs.existsSync(gifPath1) ? gifPath1 : fs.existsSync(gifPath2) ? gifPath2 : null;
  const imgPath = fs.existsSync(imgPath1) ? imgPath1 : fs.existsSync(imgPath2) ? imgPath2 : null;

  if (gifPath) {
    if (!_cachedGif || (now - _cachedImageTime > CACHE_TTL)) {
      try {
        _cachedGif = fs.readFileSync(gifPath);
        _cachedGifMp4 = null;
        const tmpDir = path.join(process.cwd(), 'tmp');
        if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });
        const tmpMp4 = path.join(tmpDir, 'menu_gif_cached.mp4');
        try {
          execSync(`ffmpeg -y -i "${gifPath}" -vf "scale=trunc(iw/2)*2:trunc(ih/2)*2" -c:v libx264 -pix_fmt yuv420p -preset fast -crf 23 -movflags +faststart -an "${tmpMp4}" 2>/dev/null`, { timeout: 30000 });
          _cachedGifMp4 = fs.readFileSync(tmpMp4);
          try { fs.unlinkSync(tmpMp4); } catch {}
        } catch {}
        _cachedImageTime = now;
      } catch {}
    }
    return { type: 'gif', buffer: _cachedGif, mp4Buffer: _cachedGifMp4 };
  }

  if (imgPath) {
    if (!_cachedImage || (now - _cachedImageTime > CACHE_TTL)) {
      try {
        _cachedImage = fs.readFileSync(imgPath);
        _cachedImageTime = now;
      } catch {}
    }
    return { type: 'image', buffer: _cachedImage };
  }

  return null;
}

export async function getMenuImageBuffer() {
  const media = getMenuMedia();
  if (media) {
    return media;
  }
  try {
    const res = await axios.get(DEFAULT_MENU_IMAGE_URL, { responseType: 'arraybuffer', timeout: 10000 });
    return { type: 'image', buffer: Buffer.from(res.data) };
  } catch {
    return null;
  }
}

export async function sendMenuMessage(sock, jid, headerText, commandsText, m) {
  const fkontak = await sendLoadingMessage(sock, jid, 'menu', m);
  const fadedHeader = createFadedEffect(headerText);
  const fullText = createReadMoreEffect(fadedHeader, commandsText + '\n\n🐺 *POWERED BY WOLF TECH* 🐺');

  const media = await getMenuImageBuffer();
  if (media) {
    if (media.type === 'gif' && media.mp4Buffer) {
      await sock.sendMessage(jid, { video: media.mp4Buffer, gifPlayback: true, caption: fullText, mimetype: "video/mp4" }, { quoted: fkontak });
    } else {
      await sock.sendMessage(jid, { image: media.buffer, caption: fullText, mimetype: "image/jpeg" }, { quoted: fkontak });
    }
  } else {
    await sock.sendMessage(jid, { text: fullText }, { quoted: fkontak });
  }
}

export async function sendSubMenu(sock, jid, menuLabel, commandsText, m, customHeader) {
  const botName = getBotName();
  const fkontak = await sendLoadingMessage(sock, jid, menuLabel, m);

  const headerText = customHeader || `╭─⌈ \`${botName}\` ⌋\n│  ╰⊷ *${menuLabel}*\n╰─⊷`;
  const fadedHeader = createFadedEffect(headerText);
  const fullText = createReadMoreEffect(fadedHeader, commandsText + '\n\n🐺 *POWERED BY WOLF TECH* 🐺');

  const media = await getMenuImageBuffer();
  if (media) {
    if (media.type === 'gif' && media.mp4Buffer) {
      await sock.sendMessage(jid, { video: media.mp4Buffer, gifPlayback: true, caption: fullText, mimetype: "video/mp4" }, { quoted: fkontak });
    } else {
      await sock.sendMessage(jid, { image: media.buffer, caption: fullText, mimetype: "image/jpeg" }, { quoted: fkontak });
    }
  } else {
    await sock.sendMessage(jid, { text: fullText }, { quoted: fkontak });
  }
}

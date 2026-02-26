import { createRequire } from 'module';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { getBotName, buildMenuHeader, createFakeContact, createFadedEffect, createReadMoreEffect, getMenuImageBuffer, sendLoadingMessage } from './menuHelper.js';
import { isButtonModeEnabled } from './buttonMode.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const require = createRequire(import.meta.url);

let sendInteractiveMessage, sendButtons;
try {
  const giftedBtns = require('gifted-btns');
  sendInteractiveMessage = giftedBtns.sendInteractiveMessage;
  sendButtons = giftedBtns.sendButtons;
} catch (e) {
  console.log('[ButtonHelper] gifted-btns not available:', e.message);
}

export function isButtonMode() {
  return isButtonModeEnabled();
}

export function isGiftedBtnsAvailable() {
  return typeof sendInteractiveMessage === 'function';
}

export async function sendButtonMenu(sock, jid, options = {}) {
  const {
    title = '',
    text = '',
    footer = '',
    buttons = [],
    image = null,
    quoted = null
  } = options;

  let fullText = '';
  if (title) fullText += `*${title}*\n\n`;
  fullText += text;
  if (footer) fullText += `\n\n${footer}`;
  await sock.sendMessage(jid, { text: fullText }, quoted ? { quoted } : {});
}

export async function sendMainMenuButtons(sock, jid, m, PREFIX) {
  const botName = getBotName();
  const fkontak = createFakeContact(m);

  const headerText = buildMenuHeader('🐺 MAIN MENU', PREFIX);

  const menuCategories = [
    { text: '🤖 AI Menu', id: `${PREFIX}aimenu` },
    { text: '🐙 Anime Menu', id: `${PREFIX}animemenu` },
    { text: '⚙️ Automation Menu', id: `${PREFIX}automenu` },
    { text: '🎨 Logo Design Menu', id: `${PREFIX}logomenu` },
    { text: '⬇️ Downloaders Menu', id: `${PREFIX}downloadmenu` },
    { text: '✨ Ephoto Menu', id: `${PREFIX}ephotomenu` },
    { text: '🛡️ Security Menu', id: `${PREFIX}securitymenu` },
    { text: '🎉 Fun Menu', id: `${PREFIX}funmenu` },
    { text: '🎮 Games Menu', id: `${PREFIX}gamemenu` },
    { text: '🐙 GitHub Menu', id: `${PREFIX}gitmenu` },
    { text: '🏠 Group Menu', id: `${PREFIX}groupmenu` },
    { text: '🖼️ ImageGen Menu', id: `${PREFIX}imagemenu` },
    { text: '🔄 Media Convert Menu', id: `${PREFIX}mediamenu` },
    { text: '🎵 Music Menu', id: `${PREFIX}musicmenu` },
    { text: '👑 Owner Menu', id: `${PREFIX}ownermenu` },
    { text: '📸 PhotoFunia Menu', id: `${PREFIX}photofunia` },
    { text: '🏆 Sports Menu', id: `${PREFIX}sportsmenu` },
    { text: '🕵️ Stalker Menu', id: `${PREFIX}stalkermenu` },
    { text: '🔧 Tools Menu', id: `${PREFIX}toolsmenu` },
    { text: '💝 Valentine Menu', id: `${PREFIX}valentinemenu` },
    { text: '🎬 AI Videos Menu', id: `${PREFIX}videomenu` },
  ];

  let menuText = `${headerText}\n\n📋 *Menu Categories:*\n\n`;
  menuCategories.forEach(cat => {
    menuText += `├─ ${cat.text} → *${cat.id}*\n`;
  });
  menuText += `\n📜 Full list: *${PREFIX}menu2*\n🏓 Ping: *${PREFIX}ping*`;
  menuText += `\n\n🐺 *POWERED BY ${botName.toUpperCase()}* 🐺`;

  try {
    const media = await getMenuImageBuffer();
    if (media) {
      if (media.type === 'gif' && media.mp4Buffer) {
        await sock.sendMessage(jid, { video: media.mp4Buffer, gifPlayback: true, caption: menuText, mimetype: "video/mp4" }, { quoted: fkontak });
      } else {
        await sock.sendMessage(jid, { image: media.buffer, caption: menuText, mimetype: "image/jpeg" }, { quoted: fkontak });
      }
    } else {
      await sock.sendMessage(jid, { text: menuText }, { quoted: fkontak });
    }
  } catch (err) {
    console.log('[ButtonMenu] Main menu send failed:', err.message);
    await sock.sendMessage(jid, { text: menuText }, { quoted: fkontak });
  }
}

export async function sendResponseWithButtons(sock, jid, options = {}, m = null) {
  const {
    text = '',
    footer = '',
    buttons = [],
    image = null
  } = options;

  await sock.sendMessage(jid, { text }, m ? { quoted: m } : {});
}

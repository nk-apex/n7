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

  if (!isGiftedBtnsAvailable()) {
    let fallbackText = '';
    if (title) fallbackText += `*${title}*\n\n`;
    fallbackText += text;
    if (footer) fallbackText += `\n\n${footer}`;
    return sock.sendMessage(jid, { text: fallbackText }, quoted ? { quoted } : {});
  }

  const interactiveButtons = buttons.map(btn => {
    if (btn.type === 'reply') {
      return {
        name: 'quick_reply',
        buttonParamsJson: JSON.stringify({
          display_text: btn.text,
          id: btn.id || btn.text
        })
      };
    } else if (btn.type === 'url') {
      return {
        name: 'cta_url',
        buttonParamsJson: JSON.stringify({
          display_text: btn.text,
          url: btn.url
        })
      };
    } else if (btn.type === 'copy') {
      return {
        name: 'cta_copy',
        buttonParamsJson: JSON.stringify({
          display_text: btn.text,
          copy_code: btn.copy_code
        })
      };
    } else if (btn.type === 'list') {
      return {
        name: 'single_select',
        buttonParamsJson: JSON.stringify({
          title: btn.title || 'Select',
          sections: btn.sections
        })
      };
    }
    return btn;
  });

  const msgOptions = {
    text,
    footer,
    interactiveButtons
  };

  if (image) {
    msgOptions.image = image;
  }

  try {
    await sendInteractiveMessage(sock, jid, msgOptions);
  } catch (err) {
    console.log('[ButtonHelper] Interactive send failed, using fallback:', err.message);
    let fallbackText = '';
    if (title) fallbackText += `*${title}*\n\n`;
    fallbackText += text;
    if (footer) fallbackText += `\n\n${footer}`;
    await sock.sendMessage(jid, { text: fallbackText }, quoted ? { quoted } : {});
  }
}

export async function sendMainMenuButtons(sock, jid, m, PREFIX) {
  const botName = getBotName();
  const fkontak = createFakeContact(m);

  await sock.sendMessage(jid, {
    text: `⚡ ${botName} menu loading...`
  }, { quoted: fkontak });
  await new Promise(resolve => setTimeout(resolve, 500));

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

  const sections = [{
    title: '🐺 Menu Categories',
    rows: menuCategories.map(cat => ({
      title: cat.text,
      id: cat.id,
      description: `Open ${cat.text}`
    }))
  }];

  const interactiveButtons = [
    {
      name: 'single_select',
      buttonParamsJson: JSON.stringify({
        title: '📋 Open Menu Category',
        sections
      })
    },
    {
      name: 'quick_reply',
      buttonParamsJson: JSON.stringify({
        display_text: '📜 Full Command List',
        id: `${PREFIX}menu2`
      })
    },
    {
      name: 'quick_reply',
      buttonParamsJson: JSON.stringify({
        display_text: '🏓 Ping',
        id: `${PREFIX}ping`
      })
    }
  ];

  const bodyText = `${headerText}\n\n📋 *Select a category below to view commands:*`;

  try {
    if (!isGiftedBtnsAvailable()) {
      throw new Error('gifted-btns not loaded');
    }

    const media = await getMenuImageBuffer();
    if (media) {
      try {
        if (media.type === 'gif' && media.mp4Buffer) {
          await sock.sendMessage(jid, { video: media.mp4Buffer, gifPlayback: true, mimetype: "video/mp4" }, { quoted: fkontak });
        } else if (media.buffer) {
          await sock.sendMessage(jid, { image: media.buffer, mimetype: "image/jpeg" }, { quoted: fkontak });
        }
      } catch {}
    }

    const msgOptions = {
      text: bodyText,
      footer: `🐺 ${botName} | Style: Buttons`,
      interactiveButtons
    };

    await sendInteractiveMessage(sock, jid, msgOptions);
  } catch (err) {
    console.log('[ButtonMenu] Main menu buttons failed, using text fallback:', err.message);
    let fallback = `${headerText}\n\n📋 *Menu Categories:*\n\n`;
    menuCategories.forEach(cat => {
      fallback += `├─ ${cat.text} → *${cat.id}*\n`;
    });
    fallback += `\n🐺 *POWERED BY ${botName.toUpperCase()}* 🐺`;

    const media = await getMenuImageBuffer();
    if (media) {
      if (media.type === 'gif' && media.mp4Buffer) {
        await sock.sendMessage(jid, { video: media.mp4Buffer, gifPlayback: true, caption: fallback, mimetype: "video/mp4" }, { quoted: fkontak });
      } else {
        await sock.sendMessage(jid, { image: media.buffer, caption: fallback, mimetype: "image/jpeg" }, { quoted: fkontak });
      }
    } else {
      await sock.sendMessage(jid, { text: fallback }, { quoted: fkontak });
    }
  }
}

export async function sendResponseWithButtons(sock, jid, options = {}, m = null) {
  const {
    text = '',
    footer = '',
    buttons = [],
    image = null
  } = options;

  if (!isButtonMode() || !isGiftedBtnsAvailable()) {
    return sock.sendMessage(jid, { text }, m ? { quoted: m } : {});
  }

  const interactiveButtons = buttons.map(btn => {
    if (btn.type === 'reply') {
      return {
        name: 'quick_reply',
        buttonParamsJson: JSON.stringify({
          display_text: btn.text,
          id: btn.id || btn.text
        })
      };
    } else if (btn.type === 'url') {
      return {
        name: 'cta_url',
        buttonParamsJson: JSON.stringify({
          display_text: btn.text,
          url: btn.url
        })
      };
    } else if (btn.type === 'copy') {
      return {
        name: 'cta_copy',
        buttonParamsJson: JSON.stringify({
          display_text: btn.text,
          copy_code: btn.copy_code
        })
      };
    }
    return btn;
  });

  try {
    const msgOptions = { text, footer, interactiveButtons };
    if (image) msgOptions.image = image;
    await sendInteractiveMessage(sock, jid, msgOptions);
  } catch (err) {
    console.log('[ButtonHelper] Response buttons failed:', err.message);
    await sock.sendMessage(jid, { text }, m ? { quoted: m } : {});
  }
}

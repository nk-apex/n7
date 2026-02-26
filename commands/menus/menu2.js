import { createRequire } from 'module';
import { getBotName } from '../../lib/menuHelper.js';

const require = createRequire(import.meta.url);

let giftedBtns;
try {
  giftedBtns = require('gifted-btns');
} catch (e) {}

export default {
  name: "menu2",
  alias: ["menulist", "categories", "allmenu", "menus"],
  desc: "Shows all category menus with buttons",
  category: "Menu",
  usage: ".menu2",

  async execute(sock, m, args, PREFIX) {
    const chatId = m.key.remoteJid;
    const prefix = PREFIX || global.prefix || '.';
    const botName = getBotName();

    const categories = [
      { name: 'aimenu', icon: '🤖', desc: 'AI commands & models' },
      { name: 'animemenu', icon: '🌸', desc: 'Anime reactions & waifus' },
      { name: 'automenu', icon: '⚙️', desc: 'Automation settings' },
      { name: 'downloadmenu', icon: '⬇️', desc: 'Media downloads' },
      { name: 'ephotomenu', icon: '✨', desc: 'Ephoto effects' },
      { name: 'funmenu', icon: '🎭', desc: 'Fun & entertainment' },
      { name: 'gamemenu', icon: '🎮', desc: 'Games & quizzes' },
      { name: 'gitmenu', icon: '🐙', desc: 'GitHub tools' },
      { name: 'groupmenu', icon: '🏠', desc: 'Group management' },
      { name: 'imagemenu', icon: '🖼️', desc: 'Image generation' },
      { name: 'logomenu', icon: '🎨', desc: 'Logo design studio' },
      { name: 'mediamenu', icon: '🔄', desc: 'Media conversion' },
      { name: 'musicmenu', icon: '🎵', desc: 'Music & audio' },
      { name: 'ownermenu', icon: '👑', desc: 'Owner controls' },
      { name: 'photofunia', icon: '📸', desc: 'PhotoFunia effects' },
      { name: 'securitymenu', icon: '🛡️', desc: 'Security & hacking' },
      { name: 'stalkermenu', icon: '🕵️', desc: 'Stalker commands' },
      { name: 'sportsmenu', icon: '🏆', desc: 'Live sports scores' },
      { name: 'toolsmenu', icon: '✨', desc: 'Tools & utilities' },
      { name: 'valentinemenu', icon: '💝', desc: 'Valentine effects' },
      { name: 'videomenu', icon: '🎬', desc: 'AI video effects' },
    ];

    let menuText = `╭─⌈ 📋 *${botName} CATEGORY MENUS* ⌋\n│\n`;
    categories.forEach(cat => {
      menuText += `├─⊷ *${prefix}${cat.name}*\n│  └⊷ ${cat.icon} ${cat.desc}\n`;
    });
    menuText += `│\n│ 📜 Tap a button or type a\n│ menu name to see commands\n│\n╰─⊷ *🐺 ${botName}*`;

    const interactiveButtons = categories.map(cat => ({
      name: 'quick_reply',
      buttonParamsJson: JSON.stringify({
        display_text: `${cat.icon} ${cat.name.replace('menu', '').charAt(0).toUpperCase() + cat.name.replace('menu', '').slice(1)}`,
        id: `${prefix}${cat.name}`
      })
    }));

    interactiveButtons.push({
      name: 'quick_reply',
      buttonParamsJson: JSON.stringify({
        display_text: '🐺 Main Menu',
        id: `${prefix}menu`
      })
    });

    interactiveButtons.push({
      name: 'quick_reply',
      buttonParamsJson: JSON.stringify({
        display_text: '🏓 Ping',
        id: `${prefix}ping`
      })
    });

    if (giftedBtns?.sendInteractiveMessage) {
      try {
        await giftedBtns.sendInteractiveMessage(sock, chatId, {
          text: menuText,
          footer: `🐺 ${botName}`,
          interactiveButtons
        });
        console.log('[Menu2] ✅ Sent with gifted-btns buttons');
        return;
      } catch (err) {
        console.log('[Menu2] gifted-btns failed:', err?.message || err);
      }
    }

    await sock.sendMessage(chatId, { text: menuText }, { quoted: m });
    console.log('[Menu2] Sent as plain text fallback');
  }
};

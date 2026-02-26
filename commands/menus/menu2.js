import { isButtonModeEnabled } from '../../lib/buttonMode.js';
import { isGiftedBtnsAvailable, sendButtonMenu } from '../../lib/buttonHelper.js';

export default {
  name: "menu2",
  alias: ["menulist", "categories", "allmenu", "menus"],
  desc: "Shows all category menus",
  category: "Menu",
  usage: ".menu2",

  async execute(sock, m, args, PREFIX) {
    const chatId = m.key.remoteJid;
    const prefix = PREFIX || '.';

    const categories = [
      { name: 'aimenu', icon: '🤖', desc: 'AI commands & models' },
      { name: 'animemenu', icon: '🌸', desc: 'Anime reactions & waifus' },
      { name: 'automenu', icon: '⚙️', desc: 'Automation settings' },
      { name: 'downloadmenu', icon: '⬇️', desc: 'Media downloads' },
      { name: 'funmenu', icon: '🎭', desc: 'Fun & entertainment' },
      { name: 'gamemenu', icon: '🎮', desc: 'Games & quizzes' },
      { name: 'gitmenu', icon: '🐙', desc: 'GitHub tools' },
      { name: 'groupmenu', icon: '🏠', desc: 'Group management' },
      { name: 'imagemenu', icon: '🖼️', desc: 'Image generation' },
      { name: 'logomenu', icon: '🎨', desc: 'Logo design studio' },
      { name: 'mediamenu', icon: '🔄', desc: 'Media conversion' },
      { name: 'musicmenu', icon: '🎵', desc: 'Music & audio' },
      { name: 'ownermenu', icon: '👑', desc: 'Owner controls' },
      { name: 'securitymenu', icon: '🛡️', desc: 'Security & hacking' },
      { name: 'stalkermenu', icon: '🕵️', desc: 'Stalker commands' },
      { name: 'sportsmenu', icon: '🏆', desc: 'Live sports scores' },
      { name: 'toolsmenu', icon: '✨', desc: 'Tools & utilities' },
      { name: 'videomenu', icon: '🎬', desc: 'AI video effects' },
    ];

    if (isButtonModeEnabled() && isGiftedBtnsAvailable()) {
      const interactiveButtons = categories.map(cat => ({
        name: 'quick_reply',
        buttonParamsJson: JSON.stringify({
          display_text: `${cat.icon} ${cat.name.replace('menu', '').charAt(0).toUpperCase() + cat.name.replace('menu', '').slice(1)}`,
          id: `${prefix}${cat.name}`
        })
      }));

      try {
        const { createRequire } = await import('module');
        const _require = createRequire(import.meta.url);
        const giftedBtns = _require('gifted-btns');
        await giftedBtns.sendInteractiveMessage(sock, chatId, {
          text: `📋 *All Menu Categories*\n\nTap any button to open that menu`,
          interactiveButtons
        });
      } catch (err) {
        let fallback = `╭─⌈ 📋 *ALL CATEGORY MENUS* ⌋\n│\n`;
        categories.forEach(cat => {
          fallback += `├─⊷ *${prefix}${cat.name}*\n│  └⊷ ${cat.icon} ${cat.desc}\n`;
        });
        fallback += `│\n│ Type any menu name to see\n│ its full list of commands\n│\n╰───`;
        await sock.sendMessage(chatId, { text: fallback }, { quoted: m });
      }
      return;
    }

    const menu = `╭─⌈ 📋 *ALL CATEGORY MENUS* ⌋
│
├─⊷ *aimenu*
│  └⊷ 🤖 AI commands & models
├─⊷ *animemenu*
│  └⊷ 🌸 Anime reactions & waifus
├─⊷ *automenu*
│  └⊷ ⚙️ Automation settings
├─⊷ *downloadmenu*
│  └⊷ ⬇️ Media downloads
├─⊷ *funmenu*
│  └⊷ 🎭 Fun & entertainment
├─⊷ *gamemenu*
│  └⊷ 🎮 Games & quizzes
├─⊷ *gitmenu*
│  └⊷ 🐙 GitHub tools
├─⊷ *groupmenu*
│  └⊷ 🏠 Group management
├─⊷ *imagemenu*
│  └⊷ 🖼️ Image generation
├─⊷ *logomenu*
│  └⊷ 🎨 Logo design studio
├─⊷ *mediamenu*
│  └⊷ 🔄 Media conversion
├─⊷ *musicmenu*
│  └⊷ 🎵 Music & audio
├─⊷ *ownermenu*
│  └⊷ 👑 Owner controls
├─⊷ *securitymenu*
│  └⊷ 🛡️ Security & hacking
├─⊷ *stalkermenu*
│  └⊷ 🕵️ Stalker commands
├─⊷ *sportsmenu*
│  └⊷ 🏆 Live sports scores
├─⊷ *toolsmenu*
│  └⊷ ✨ Tools & utilities
├─⊷ *videomenu*
│  └⊷ 🎬 AI video effects
│
│ Type any menu name to see
│ its full list of commands
│
╰───`;

    await sock.sendMessage(chatId, { text: menu }, { quoted: m });
  }
};

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
      const headerText = `╭─⌈ 📋 *ALL CATEGORY MENUS* ⌋\n│\n│ Select a category below to\n│ view its commands\n│\n╰───`;

      const rows = categories.map(cat => ({
        title: `${cat.icon} ${cat.name}`,
        id: `${prefix}${cat.name}`,
        description: cat.desc
      }));

      const interactiveButtons = [
        {
          name: 'single_select',
          buttonParamsJson: JSON.stringify({
            title: '📋 Select Category',
            sections: [{ title: 'Menu Categories', rows }]
          })
        }
      ];

      const quickBtns = categories.slice(0, 3).map(cat => ({
        type: 'reply',
        text: `${cat.icon} ${cat.name.replace('menu', '')}`,
        id: `${prefix}${cat.name}`
      }));

      quickBtns.forEach(btn => {
        interactiveButtons.push({
          name: 'quick_reply',
          buttonParamsJson: JSON.stringify({
            display_text: btn.text,
            id: btn.id
          })
        });
      });

      try {
        const { createRequire } = await import('module');
        const _require = createRequire(import.meta.url);
        const giftedBtns = _require('gifted-btns');
        await giftedBtns.sendInteractiveMessage(sock, chatId, {
          text: headerText,
          footer: '🐺 WOLFBOT | Tap a category',
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

import { sendInteractiveWithImage } from '../../lib/buttonHelper.js';
import { getBotName, getMenuImageBuffer } from '../../lib/menuHelper.js';

export default {
  name: "menu2",
  alias: ["menulist", "categories", "allmenu", "menus"],
  desc: "Shows all category menus with buttons",
  category: "Menu",
  usage: ".menu2",

  async execute(sock, m, args, PREFIX) {
    const chatId = m.key.remoteJid;
    const prefix = PREFIX || global.prefix || '.';

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

    const botName = getBotName();
    const bodyText = `╭─⌈ 📋 *ALL CATEGORY MENUS* ⌋\n│\n│ Tap a button below to open\n│ any category menu\n│\n╰─⊷ *${botName}*`;

    try {
      const media = await getMenuImageBuffer();
      await sendInteractiveWithImage(sock, chatId, {
        bodyText,
        footerText: `🐺 ${botName}`,
        buttons: interactiveButtons,
        imageBuffer: media?.buffer || null,
        mimetype: 'image/jpeg'
      });
    } catch (err) {
      console.log('[Menu2] Interactive failed, using fallback:', err.message);
      let fallback = `╭─⌈ 📋 *ALL CATEGORY MENUS* ⌋\n│\n`;
      categories.forEach(cat => {
        fallback += `├─⊷ *${prefix}${cat.name}*\n│  └⊷ ${cat.icon} ${cat.desc}\n`;
      });
      fallback += `│\n│ Type any menu name to see\n│ its full list of commands\n│\n╰───`;
      await sock.sendMessage(chatId, { text: fallback }, { quoted: m });
    }
  }
};

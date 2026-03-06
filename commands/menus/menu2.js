import { createRequire } from 'module';
import { getBotName, getOwnerName, getBotMode, getBotVersion, formatUptime, getRAMUsage, getMenuMedia } from '../../lib/menuHelper.js';
import { isButtonModeEnabled } from '../../lib/buttonMode.js';
import { getPlatformInfo } from '../../lib/platformDetect.js';

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
      { name: 'securitymenu', icon: '🛡️', desc: 'Security & hacking' },
      { name: 'stalkermenu', icon: '🕵️', desc: 'Stalker commands' },
      { name: 'sportsmenu', icon: '🏆', desc: 'Live sports scores' },
      { name: 'toolsmenu', icon: '✨', desc: 'Tools & utilities' },
      { name: 'valentinemenu', icon: '💝', desc: 'Valentine effects' },
      { name: 'videomenu', icon: '🎬', desc: 'AI video effects' },
    ];

    const buttonMode = isButtonModeEnabled();

    if (buttonMode && giftedBtns?.sendInteractiveMessage) {
      const mid = Math.ceil(categories.length / 2);
      const sections = [
        {
          title: '📂 Categories (1)',
          rows: categories.slice(0, mid).map(cat => ({
            id: `${prefix}${cat.name}`,
            title: `${cat.icon} ${cat.name.replace('menu', '').charAt(0).toUpperCase() + cat.name.replace('menu', '').slice(1)}`,
            description: cat.desc
          }))
        },
        {
          title: '📂 Categories (2)',
          rows: categories.slice(mid).map(cat => ({
            id: `${prefix}${cat.name}`,
            title: `${cat.icon} ${cat.name.replace('menu', '').charAt(0).toUpperCase() + cat.name.replace('menu', '').slice(1)}`,
            description: cat.desc
          }))
        }
      ];

      const interactiveButtons = [
        {
          name: 'single_select',
          buttonParamsJson: JSON.stringify({
            title: '📋 Browse Categories',
            sections
          })
        },
        {
          name: 'quick_reply',
          buttonParamsJson: JSON.stringify({
            display_text: '🐺 Main Menu',
            id: `${prefix}menu`
          })
        },
        {
          name: 'quick_reply',
          buttonParamsJson: JSON.stringify({
            display_text: '🏓 Ping',
            id: `${prefix}ping`
          })
        }
      ];

      try {
        await giftedBtns.sendInteractiveMessage(sock, chatId, {
          text: `🐺 *${botName} CATEGORY MENU*\n\nSelect a category from the list below to explore its commands.`,
          footer: `🐺 ${botName}`,
          interactiveButtons
        });
        return;
      } catch (err) {
        // fall through to default below
      }
    }

    // ── Default mode: ┃ box style header + image + category list ──
    const platform = getPlatformInfo();
    const ramUsage = getRAMUsage();
    const ownerName = getOwnerName();
    const botMode = getBotMode();
    const botVersion = getBotVersion();

    const barLength = 10;
    const filledBars = Math.round((ramUsage.percent / 100) * barLength);
    const ramBar = '█'.repeat(filledBars) + '░'.repeat(barLength - filledBars);

    const infoHeader = `╭─⌈ \`${botName}\` ⌋
┃ Owner: ${ownerName}
┃ Mode: ${botMode}
┃ Prefix: [ ${prefix} ]
┃ Version: ${botVersion}
┃ Platform: ${platform.icon} ${platform.name}
┃ Status: ${platform.status}
┃ Uptime: ${formatUptime(process.uptime())}
┃ RAM: ${ramBar} ${ramUsage.percent}%
┃ Memory: ${ramUsage.usedMB}MB / ${ramUsage.totalMB}MB
╰─⊷`;

    let catList = '';
    categories.forEach(cat => {
      catList += `├─⊷ *${prefix}${cat.name}*\n│  └⊷ ${cat.icon} ${cat.desc}\n`;
    });

    const caption = `${infoHeader}\n\n╭─⌈ 📋 *CATEGORY MENUS* ⌋\n│\n${catList}│\n╰─⊷ *🐺 ${botName}*`;

    const media = getMenuMedia();
    if (media) {
      if (media.type === 'gif' && media.mp4Buffer) {
        await sock.sendMessage(chatId, { video: media.mp4Buffer, gifPlayback: true, caption, mimetype: 'video/mp4' }, { quoted: m });
      } else {
        await sock.sendMessage(chatId, { image: media.buffer, caption, mimetype: 'image/jpeg' }, { quoted: m });
      }
    } else {
      await sock.sendMessage(chatId, { text: caption }, { quoted: m });
    }
  }
};

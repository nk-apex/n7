export default {
  name: "menu2",
  alias: ["menulist", "categories", "allmenu", "menus"],
  desc: "Shows all category menus",
  category: "Menu",
  usage: ".menu2",

  async execute(sock, m) {
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
│ 💡 Type any menu name to see
│    its full list of commands
│
╰───`;

    await sock.sendMessage(
      m.key.remoteJid,
      { text: menu },
      { quoted: m }
    );
  }
};

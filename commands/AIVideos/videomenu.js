export default {
  name: "videomenu",
  alias: ["vidmenu", "aividmenu", "videoeffects"],
  desc: "Shows AI video effect commands",
  category: "AIVideos",
  usage: ".videomenu",

  async execute(sock, m) {
    const menu = `╭─⌈ 🎬 *AI VIDEO EFFECTS MENU* ⌋
│
├─⊷ *tigervideo*
│  └⊷ Tiger themed video
├─⊷ *introvideo*
│  └⊷ Intro video effect
├─⊷ *lightningpubg*
│  └⊷ PUBG lightning effect
├─⊷ *lovevideo*
│  └⊷ Love themed video
├─⊷ *videogen*
│  └⊷ AI video generation
│
╰───`;

    await sock.sendMessage(
      m.key.remoteJid,
      { text: menu },
      { quoted: m }
    );
  }
};

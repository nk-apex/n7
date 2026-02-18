export default {
  name: "musicmenu",
  alias: ["mmenu", "musichelp", "musiccmds"],
  desc: "Shows music and media commands",
  category: "Music",
  usage: ".musicmenu",

  async execute(sock, m) {
    const menu = `╭─⌈ 🎵 *MUSIC MENU* ⌋
│
├─⊷ *play*
│  └⊷ Play a song by name
├─⊷ *song*
│  └⊷ Download song audio
├─⊷ *video*
│  └⊷ Download music video
├─⊷ *videodoc*
│  └⊷ Video as document
├─⊷ *lyrics*
│  └⊷ Get song lyrics
├─⊷ *shazam*
│  └⊷ Identify a song
├─⊷ *spotify*
│  └⊷ Download from Spotify
│
╰───`;

    await sock.sendMessage(
      m.key.remoteJid,
      { text: menu },
      { quoted: m }
    );
  }
};

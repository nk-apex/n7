export default {
  name: "downloadmenu",
  alias: ["dlmenu", "downloadhelp", "dlcmds"],
  desc: "Shows media download commands",
  category: "Downloaders",
  usage: ".downloadmenu",

  async execute(sock, m) {
    const menu = `╭─⌈ ⬇️ *DOWNLOAD MENU* ⌋
│
│ 📱 *SOCIAL MEDIA*
│
├─⊷ *tiktok*
│  └⊷ Download TikTok video
├─⊷ *tiktoksearch*
│  └⊷ Search TikTok videos
├─⊷ *tiktokinfo*
│  └⊷ TikTok user info
├─⊷ *instagram*
│  └⊷ Download Instagram media
├─⊷ *facebook*
│  └⊷ Download Facebook video
├─⊷ *snapchat*
│  └⊷ Download Snapchat media
│
│ 🎬 *YOUTUBE*
│
├─⊷ *yts*
│  └⊷ Search YouTube
├─⊷ *ytplay*
│  └⊷ Play YouTube audio
├─⊷ *ytmp3*
│  └⊷ YouTube to MP3
├─⊷ *ytv*
│  └⊷ YouTube video download
├─⊷ *ytmp4*
│  └⊷ YouTube to MP4
├─⊷ *ytvdoc*
│  └⊷ YouTube video as document
├─⊷ *playlist*
│  └⊷ Download YouTube playlist
│
│ 📦 *OTHER*
│
├─⊷ *apk*
│  └⊷ Download Android APK
├─⊷ *mp3*
│  └⊷ Direct MP3 download
├─⊷ *mp4*
│  └⊷ Direct MP4 download
│
╰───`;

    await sock.sendMessage(
      m.key.remoteJid,
      { text: menu },
      { quoted: m }
    );
  }
};

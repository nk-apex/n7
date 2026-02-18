export default {
  name: "mediamenu",
  alias: ["convertmenu", "conversionmenu", "mediacmds"],
  desc: "Shows media conversion commands",
  category: "Media",
  usage: ".mediamenu",

  async execute(sock, m) {
    const menu = `╭─⌈ 🔄 *MEDIA CONVERSION MENU* ⌋
│
├─⊷ *toimage*
│  └⊷ Sticker to image
├─⊷ *tosticker*
│  └⊷ Image to sticker
├─⊷ *toaudio*
│  └⊷ Video to audio
├─⊷ *tovoice*
│  └⊷ Audio to voice note
├─⊷ *togif*
│  └⊷ Video to GIF
├─⊷ *tts*
│  └⊷ Text to speech
├─⊷ *bass*
│  └⊷ Bass boost audio
├─⊷ *trebleboost*
│  └⊷ Treble boost audio
├─⊷ *jarvis*
│  └⊷ JARVIS voice AI
│
╰───`;

    await sock.sendMessage(
      m.key.remoteJid,
      { text: menu },
      { quoted: m }
    );
  }
};

export default {
  name: "imagemenu",
  alias: ["imgmenu", "imagehelp", "imgcmds"],
  desc: "Shows image generation commands",
  category: "ImageGen",
  usage: ".imagemenu",

  async execute(sock, m) {
    const menu = `╭─⌈ 🖼️ *IMAGE MENU* ⌋
│
├─⊷ *image*
│  └⊷ Search for images
├─⊷ *imagine*
│  └⊷ AI image generation
├─⊷ *imagegen*
│  └⊷ Advanced AI image gen
├─⊷ *anime*
│  └⊷ AI anime art
├─⊷ *art*
│  └⊷ AI art generation
├─⊷ *real*
│  └⊷ AI realistic images
├─⊷ *remini*
│  └⊷ Enhance image quality
├─⊷ *vision*
│  └⊷ AI image analysis
│
╰───`;

    await sock.sendMessage(
      m.key.remoteJid,
      { text: menu },
      { quoted: m }
    );
  }
};

export default {
  name: "toolsmenu",
  alias: ["utilitymenu", "utilmenu", "toolshelp"],
  desc: "Shows utility and tools commands",
  category: "Utility",
  usage: ".toolsmenu",

  async execute(sock, m) {
    const menu = `╭─⌈ ✨ *TOOLS & UTILITY MENU* ⌋
│
│ 🔍 *INFO & SEARCH*
│
├─⊷ *alive*
│  └⊷ Check if bot is online
├─⊷ *ping*
│  └⊷ Bot response speed
├─⊷ *ping2*
│  └⊷ Advanced ping test
├─⊷ *time*
│  └⊷ Current time
├─⊷ *uptime*
│  └⊷ Bot uptime
├─⊷ *define*
│  └⊷ Dictionary lookup
├─⊷ *news*
│  └⊷ Latest news
├─⊷ *covid*
│  └⊷ COVID-19 stats
├─⊷ *weather*
│  └⊷ Weather forecast
├─⊷ *wiki*
│  └⊷ Wikipedia search
├─⊷ *translate*
│  └⊷ Translate text
├─⊷ *calc*
│  └⊷ Calculator
├─⊷ *iplookup*
│  └⊷ IP address lookup
├─⊷ *getip*
│  └⊷ Get IP address
├─⊷ *getpp*
│  └⊷ Get profile picture
├─⊷ *getgpp*
│  └⊷ Get group profile pic
├─⊷ *prefixinfo*
│  └⊷ Current prefix info
│
│ 🔗 *CONVERSION & MEDIA*
│
├─⊷ *shorturl*
│  └⊷ Shorten a URL
├─⊷ *url*
│  └⊷ URL tools
├─⊷ *fetch*
│  └⊷ Fetch URL content
├─⊷ *qrencode*
│  └⊷ Generate QR code
├─⊷ *take*
│  └⊷ Add sticker metadata
├─⊷ *imgbb*
│  └⊷ Upload image to ImgBB
├─⊷ *save*
│  └⊷ Save media from status
├─⊷ *screenshot*
│  └⊷ Screenshot a website
├─⊷ *inspect*
│  └⊷ Inspect a message
│
│ 📇 *CONTACT TOOLS*
│
├─⊷ *vcf*
│  └⊷ Save contacts as VCF
├─⊷ *viewvcf*
│  └⊷ View VCF file
├─⊷ *vv*
│  └⊷ View once download
├─⊷ *vv2*
│  └⊷ View once download v2
│
╰───`;

    await sock.sendMessage(
      m.key.remoteJid,
      { text: menu },
      { quoted: m }
    );
  }
};

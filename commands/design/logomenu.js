export default {
  name: "logomenu",
  alias: ["logos", "logohelp", "logocmds", "designmenu"],
  desc: "Shows logo design commands",
  category: "Design",
  usage: ".logomenu",

  async execute(sock, m) {
    const menu = `╭─⌈ 🎨 *LOGO DESIGN MENU* ⌋
│
│ 🌟 *PREMIUM METALS*
│
├─⊷ *goldlogo*
│  └⊷ Gold metallic logo
├─⊷ *silverlogo*
│  └⊷ Silver metallic logo
├─⊷ *platinumlogo*
│  └⊷ Platinum logo
├─⊷ *chromelogo*
│  └⊷ Chrome effect logo
├─⊷ *diamondlogo*
│  └⊷ Diamond encrusted logo
├─⊷ *bronzelogo*
│  └⊷ Bronze metallic logo
├─⊷ *steellogo*
│  └⊷ Steel effect logo
├─⊷ *copperlogo*
│  └⊷ Copper metallic logo
├─⊷ *titaniumlogo*
│  └⊷ Titanium logo
│
│ 🔥 *ELEMENTAL EFFECTS*
│
├─⊷ *firelogo*
│  └⊷ Fire flame logo
├─⊷ *icelogo*
│  └⊷ Frozen ice logo
├─⊷ *iceglowlogo*
│  └⊷ Glowing ice logo
├─⊷ *lightninglogo*
│  └⊷ Lightning bolt logo
├─⊷ *rainbowlogo*
│  └⊷ Rainbow colors logo
├─⊷ *sunlogo*
│  └⊷ Sun glow logo
├─⊷ *moonlogo*
│  └⊷ Moonlight logo
│
│ 🎭 *MYTHICAL & MAGICAL*
│
├─⊷ *dragonlogo*
│  └⊷ Dragon themed logo
├─⊷ *phoenixlogo*
│  └⊷ Phoenix fire logo
├─⊷ *wizardlogo*
│  └⊷ Wizard magic logo
├─⊷ *crystallogo*
│  └⊷ Crystal effect logo
├─⊷ *darkmagiclogo*
│  └⊷ Dark magic logo
│
│ 🌌 *DARK & GOTHIC*
│
├─⊷ *shadowlogo*
│  └⊷ Shadow effect logo
├─⊷ *smokelogo*
│  └⊷ Smoke effect logo
├─⊷ *bloodlogo*
│  └⊷ Blood drip logo
│
│ 💫 *GLOW & NEON*
│
├─⊷ *neonlogo*
│  └⊷ Neon glow logo
├─⊷ *glowlogo*
│  └⊷ Glowing text logo
├─⊷ *gradientlogo*
│  └⊷ Gradient colors logo
├─⊷ *matrixlogo*
│  └⊷ Matrix code logo
│
╰───`;

    await sock.sendMessage(
      m.key.remoteJid,
      { text: menu },
      { quoted: m }
    );
  }
};

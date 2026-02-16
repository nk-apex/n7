export default {
  name: "animemenu",
  alias: ["anime", "amenu"],
  desc: "Shows anime reaction commands",
  category: "Anime",
  usage: ".animemenu",

  async execute(sock, m) {
    const menu = `╭─⌈ 🌸 *ANIME MENU* 🌸 ⌋
│
│ 💖 *AFFECTION & LOVE* 💕
│
├─⊷ *cuddle*
│  └⊷ Cuddle someone
├─⊷ *kiss*
│  └⊷ Kiss someone
├─⊷ *pat*
│  └⊷ Headpat someone
├─⊷ *lick*
│  └⊷ Lick someone
├─⊷ *glomp*
│  └⊷ Tackle hug someone
├─⊷ *wink*
│  └⊷ Wink at someone
├─⊷ *highfive*
│  └⊷ Highfive someone
│
│ 😂 *FUN & REACTIONS* 🎭
│
├─⊷ *awoo*
│  └⊷ Wolf howl reaction
├─⊷ *bully*
│  └⊷ Tease someone
├─⊷ *cringe*
│  └⊷ Cringe reaction
├─⊷ *cry*
│  └⊷ Crying reaction
├─⊷ *dance*
│  └⊷ Dance reaction
├─⊷ *yeet*
│  └⊷ Yeet someone
│
│ 🔥 *SPECIAL CHARACTERS* ✨
│
├─⊷ *waifu*
│  └⊷ Random waifu image
├─⊷ *neko*
│  └⊷ Random neko image
├─⊷ *megumin*
│  └⊷ Random Megumin image
├─⊷ *shinobu*
│  └⊷ Random Shinobu image
│
│ ⚠️ *MISC & ACTION* 🌀
│
├─⊷ *kill*
│  └⊷ Playful kill reaction
├─⊷ *trap*
│  └⊷ Trap character image
├─⊷ *trap2*
│  └⊷ Trap image (sfw/nsfw)
├─⊷ *bj*
│  └⊷ NSFW reaction
│
╰───`;

    await sock.sendMessage(
      m.key.remoteJid,
      { text: menu },
      { quoted: m }
    );
  }
};

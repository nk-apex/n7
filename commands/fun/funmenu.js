export default {
  name: "funmenu",
  alias: ["funcmds", "funhelp"],
  desc: "Shows fun commands",
  category: "Fun",
  usage: ".funmenu",

  async execute(sock, m) {
    const menu = `╭─⌈ 🎭 *FUN MENU* ⌋
│
├─⊷ *bf*
│  └⊷ Find a boyfriend
├─⊷ *gf*
│  └⊷ Find a girlfriend
├─⊷ *couple*
│  └⊷ Random couple match
├─⊷ *gay*
│  └⊷ Gay meter
├─⊷ *getjid*
│  └⊷ Get user JID
├─⊷ *movie*
│  └⊷ Search movies
├─⊷ *trailer*
│  └⊷ Movie trailers
├─⊷ *goodmorning*
│  └⊷ Morning greeting
├─⊷ *goodnight*
│  └⊷ Night greeting
├─⊷ *channelstatus*
│  └⊷ Post to channel
├─⊷ *hack*
│  └⊷ Fake hacking prank
│
╰───`;

    await sock.sendMessage(
      m.key.remoteJid,
      { text: menu },
      { quoted: m }
    );
  }
};

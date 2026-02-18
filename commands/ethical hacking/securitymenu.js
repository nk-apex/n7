export default {
  name: "securitymenu",
  alias: ["hackmenu", "secmenu", "hackingmenu"],
  desc: "Shows security and hacking commands",
  category: "Security",
  usage: ".securitymenu",

  async execute(sock, m) {
    const menu = `╭─⌈ 🛡️ *SECURITY MENU* ⌋
│
├─⊷ *ipinfo*
│  └⊷ IP address information
├─⊷ *nmap*
│  └⊷ Network port scanner
├─⊷ *shodan*
│  └⊷ Shodan device search
├─⊷ *nglattack*
│  └⊷ NGL anonymous messages
│
╰───`;

    await sock.sendMessage(
      m.key.remoteJid,
      { text: menu },
      { quoted: m }
    );
  }
};

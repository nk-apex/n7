export default {
  name: "automenu",
  alias: ["autocmds", "autohelp", "automationmenu"],
  desc: "Shows automation commands",
  category: "Automation",
  usage: ".automenu",

  async execute(sock, m) {
    const menu = `╭─⌈ ⚙️ *AUTOMATION MENU* ⌋
│
├─⊷ *autoread*
│  └⊷ Auto-read messages
├─⊷ *autotyping*
│  └⊷ Auto typing indicator
├─⊷ *autorecording*
│  └⊷ Auto recording indicator
├─⊷ *autoreact*
│  └⊷ Auto-react to messages
├─⊷ *autoreactstatus*
│  └⊷ Auto-react to statuses
├─⊷ *autoviewstatus*
│  └⊷ Auto-view statuses
├─⊷ *autobio*
│  └⊷ Auto-update bot bio
├─⊷ *autorec*
│  └⊷ Auto voice recording
├─⊷ *reactowner*
│  └⊷ React to owner messages
│
╰───`;

    await sock.sendMessage(
      m.key.remoteJid,
      { text: menu },
      { quoted: m }
    );
  }
};

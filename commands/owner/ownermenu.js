import { sendSubMenu, getBotName } from '../../lib/menuHelper.js';

export default {
  name: "ownermenu",
  alias: ["omenu"],
  desc: "Shows owner-only commands",
  category: "Owner",
  usage: ".ownermenu",

  async execute(sock, m, args, PREFIX) {
    const jid = m.key.remoteJid;
    const botName = getBotName();

    const customHeader = `╭─⊷ *👑 ${botName} OWNER MENU*
│
│  ├⊷ *User:* ${m.pushName || "Owner"}
│  ├⊷ *Prefix:* [ ${PREFIX || '?'} ]
│  └⊷ *Time:* ${new Date().toLocaleTimeString('en-US', { hour12: true, hour: '2-digit', minute: '2-digit' })}
│
╰─⊷`;

    const commandsText = `╭─⊷ *⚡ CORE MANAGEMENT*
│
│  • setbotname
│  • resetbotname
│  • setowner
│  • resetowner
│  • setprefix
│  • prefix
│  • iamowner
│  • about
│  • owner
│  • block
│  • unblock
│  • blockdetect
│  • silent
│  • anticall
│  • mode
│  • setpp
│  • setfooter
│  • repo
│  • pair
│
╰─⊷

╭─⊷ *🔐 PROTECTION SYSTEMS*
│
│  • antidelete
│  • antideletestatus
│  • antiedit
│  • antiviewonce
│
╰─⊷

╭─⊷ *🔄 SYSTEM & MAINTENANCE*
│
│  • restart
│  • workingreload
│  • reloadenv
│  • getsettings
│  • setsetting
│  • test
│  • disk
│  • hostip
│  • findcommands
│  • latestupdates
│  • panel
│  • checkbotname
│  • disp
│
╰─⊷

╭─⊷ *⚙️ AUTOMATION*
│
│  • autoread
│  • autotyping
│  • autorecording
│  • autoreact
│  • autoreactstatus
│  • autoviewstatus
│  • autobio
│  • autorec
│  • reactowner
│
╰─⊷

╭─⊷ *👥 SUDO MANAGEMENT*
│
│  • addsudo
│  • delsudo
│  • listsudo
│  • checksudo
│  • clearsudo
│  • sudomode
│  • sudoinfo
│  • mysudo
│  • sudodebug
│  • linksudo
│
╰─⊷

╭─⊷ *🔒 PRIVACY CONTROLS*
│
│  • online
│  • privacy
│  • receipt
│  • profilepic
│  • viewer
│
╰─⊷

╭─⊷ *🐙 GITHUB TOOLS*
│
│  • gitclone
│  • gitinfo
│  • repanalyze
│  • update
│
╰─⊷`;

    await sendSubMenu(sock, jid, 'Owner menu', commandsText, m, customHeader);
  }
};

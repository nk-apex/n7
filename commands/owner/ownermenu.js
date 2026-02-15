import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default {
  name: "ownermenu",
  alias: ["omenu"],
  desc: "Shows owner-only commands",
  category: "Owner",
  usage: ".ownermenu",

  async execute(sock, m, args, PREFIX) {
    const jid = m.key.remoteJid;

    const createFakeContact = (message) => {
      const uid = message.key.participant?.split('@')[0] || message.key.remoteJid.split('@')[0];
      return {
        key: {
          remoteJid: "status@broadcast",
          fromMe: false,
          id: "WOLF-X"
        },
        message: {
          contactMessage: {
            displayName: "WOLF BOT",
            vcard: `BEGIN:VCARD\nVERSION:3.0\nN:Sy;Bot;;;\nFN:WOLF BOT\nitem1.TEL;waid=${uid}:${uid}\nitem1.X-ABLabel:Ponsel\nEND:VCARD`
          }
        },
        participant: "0@s.whatsapp.net"
      };
    };

    const fkontak = createFakeContact(m);

    const invisibleChars = [
      '\u200E', '\u200F', '\u200B', '\u200C',
      '\u200D', '\u2060', '\uFEFF',
    ];
    const invisibleString = Array.from({ length: 550 },
      (_, i) => invisibleChars[i % invisibleChars.length]
    ).join('');

    let infoSection = `╭─⊷「 *WOLFBOT OWNER MENU* 」
│
├─⊷ *👑 OWNER PANEL*
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
╰─⊷

🐺 *POWERED BY WOLF TECH* 🐺`;

    const menu = `${infoSection}${invisibleString}\n${commandsText}`;

    const imgPath1 = path.join(__dirname, '../menus/media/wolfbot.jpg');
    const imgPath2 = path.join(__dirname, '../media/wolfbot.jpg');
    const imagePath = fs.existsSync(imgPath1) ? imgPath1 : fs.existsSync(imgPath2) ? imgPath2 : null;

    if (imagePath) {
      const buffer = fs.readFileSync(imagePath);
      await sock.sendMessage(jid, {
        image: buffer,
        caption: menu,
        mimetype: "image/jpeg"
      }, { quoted: fkontak });
    } else {
      await sock.sendMessage(jid, { text: menu }, { quoted: fkontak });
    }
  }
};

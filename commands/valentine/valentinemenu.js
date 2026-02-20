export default {
    name: 'valentinemenu',
    alias: ['vmenu', 'lovemenu'],
    category: 'valentine',
    description: 'Show all Valentine\'s Day commands',

    async execute(sock, msg, args) {
        const chatId = msg.key.remoteJid;
        const p = global.prefix || '.';

        const menuText = `╭─⌈ 💕 *VALENTINE'S DAY MENU* ⌋
│
├─⊷ 🌹 *${p}rosevine* <text1> | <text2>
│  └⊷ Rose vine effect (reply to image)
│
├─⊷ 💌 *${p}loveletter*
│  └⊷ Love letter effect (reply to image)
│
├─⊷ 🔒 *${p}lovelock* <text>
│  └⊷ Love lock/padlock effect
│
├─⊷ 💒 *${p}weddingday*
│  └⊷ Wedding day effect (reply to image)
│
├─⊷ 💎 *${p}brooches*
│  └⊷ Brooches effect (reply to image)
│
├─⊷ 💝 *${p}valentine* <text>
│  └⊷ Valentine's Day effect (reply to image)
│
╰─⌊ _🐺 Created by WOLFBOT_ ⌋`;

        await sock.sendMessage(chatId, { text: menuText }, { quoted: msg });
    }
};

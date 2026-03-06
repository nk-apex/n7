import { getBadWords } from '../../lib/badwords-store.js';

export default {
    name: 'listbadword',
    alias: ['listswear', 'badwords', 'badwordlist'],
    description: 'List all words in the bad word filter',
    category: 'group',
    async execute(sock, msg, args) {
        const chatId = msg.key.remoteJid;
        const words = getBadWords();

        if (words.length === 0) {
            return sock.sendMessage(chatId, {
                text: `╭─⌈ 🤬 *BAD WORD FILTER* ⌋\n│\n├─⊷ No bad words added yet.\n│\n├─⊷ Use *.addbadword <word>* to add words\n╰───`,
            }, { quoted: msg });
        }

        const numbered = words.map((w, i) => `│  ${i + 1}. ${w}`).join('\n');
        return sock.sendMessage(chatId, {
            text: `╭─⌈ 🤬 *BAD WORD FILTER* ⌋\n│\n├─⊷ *Total:* ${words.length} word(s)\n│\n${numbered}\n│\n├─⊷ Use *.removebadword <word>* to remove\n├─⊷ Use *.antibadword on/off* to toggle\n╰───`,
        }, { quoted: msg });
    }
};

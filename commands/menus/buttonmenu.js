import { getButtonCommandList } from '../../lib/commandButtons.js';
import { isButtonModeEnabled } from '../../lib/buttonMode.js';

export default {
    name: 'buttonmenu',
    alias: ['menubutton', 'btnmenu', 'menubtn', 'buttonlist', 'btnlist'],
    category: 'Menu',
    desc: 'List all commands with interactive button support',
    usage: '.buttonmenu [category]',

    async execute(sock, m, args, PREFIX) {
        const chatId = m.key.remoteJid;
        const prefix = PREFIX || '.';
        const allCmds = getButtonCommandList();
        const buttonStatus = isButtonModeEnabled() ? '🟢 ACTIVE' : '🔴 INACTIVE';

        const categoryMap = {
            'downloaders': ['play', 'song', 'video', 'tiktok', 'instagram', 'facebook', 'twitter', 'apk', 'mediafire', 'gdrive', 'spotify', 'soundcloud', 'pinterest', 'reddit', 'snack', 'likee', 'capcut'],
            'ai': ['chatgpt', 'gpt', 'gemini', 'bard', 'claude', 'claudeai', 'copilot', 'bing', 'blackbox', 'cohere', 'llama', 'mistral', 'perplexity', 'venice', 'wormgpt', 'analyze', 'flux', 'imagine', 'vision', 'art', 'real', 'imagegen', 'remini', 'logo', 'brandlogo', 'companylogo', 'textlogo', 'wolf'],
            'group': ['kick', 'remove', 'promote', 'demote', 'mute', 'unmute', 'ban', 'unban', 'warn', 'antilink', 'antispam', 'antibug', 'welcome', 'goodbye', 'setdesc', 'setname', 'invite', 'revoke', 'tagall', 'tagadmin', 'groupinfo', 'creategroup', 'approveall'],
            'utility': ['ping', 'translate', 'weather', 'screenshot', 'shorturl', 'qrencode', 'define', 'wiki', 'news', 'covid', 'time', 'alive', 'uptime', 'prefix', 'fetch', 'npm', 'take', 'quoted', 'save', 'vcf'],
            'media': ['8d', 'bassboost', 'bass', 'boost', 'deepbass', 'superboost', 'treble', 'trebleboost', 'vocalboost', 'nightcore', 'reverb', 'echo', 'slow', 'fast', 'speed', 'reverse', 'baby', 'demon', 'robot', 'jarvis', 'monster', 'radio', 'telephone', 'underwater', 'karaoke', 'tts', 'toaudio', 'tovideo', 'togif', 'toimage', 'tosticker', 'tovoice'],
            'fun': ['rps', 'coinflip', 'roll', 'dice', 'quiz', 'trivia', 'ttt', 'slot', 'truth', 'dare', 'ship', 'rate', 'roast', 'joke', 'meme', 'fact', 'quote', 'waifu', 'neko', 'hug', 'kiss', 'pat', 'slap', 'bonk', 'wink', 'wave', 'bite', 'bully', 'yeet', 'cuddle', 'poke', 'awoo', 'trap'],
            'owner': ['mode', 'block', 'unblock', 'setprefix', 'setbotname', 'restart', 'shutdown', 'clearcache', 'anticall', 'antidelete', 'antiedit', 'antiviewonce', 'autorec', 'autoread', 'autotyping', 'autorecording', 'autoreact', 'autoviewstatus', 'autobio', 'blockdetect', 'silent', 'online', 'repo', 'owner', 'disk', 'start', 'setpp', 'pair'],
            'sports': ['football', 'basketball', 'cricket', 'tennis', 'f1', 'baseball', 'hockey', 'mma', 'nfl', 'golf'],
            'stalker': ['gitstalk', 'igstalk', 'tiktokstalk', 'twitterstalk', 'ipstalk', 'npmstalk']
        };

        if (args[0]) {
            const cat = args[0].toLowerCase();
            const catNames = Object.keys(categoryMap);

            if (!categoryMap[cat]) {
                return sock.sendMessage(chatId, {
                    text: `╭─⌈ ❌ *UNKNOWN CATEGORY* ⌋\n├─⊷ Available: ${catNames.join(', ')}\n├─⊷ Usage: *${prefix}buttonmenu ${catNames[0]}*\n╰───`
                }, { quoted: m });
            }

            const catCmds = allCmds.filter(c => categoryMap[cat].includes(c.name));
            let text = `╭─⌈ 🔘 *BUTTON COMMANDS: ${cat.toUpperCase()}* ⌋\n│\n`;
            catCmds.forEach(cmd => {
                text += `├─⊷ *${prefix}${cmd.name}*`;
                if (cmd.aliases.length > 0) text += ` (${cmd.aliases.join(', ')})`;
                text += `\n│  └⊷ ${cmd.btnLabels}\n`;
            });
            text += `│\n├─⊷ *${catCmds.length}* commands in ${cat}\n├─⊷ Button Mode: ${buttonStatus}\n╰───`;

            return sock.sendMessage(chatId, { text }, { quoted: m });
        }

        let totalMain = allCmds.length;
        let totalAliases = 0;
        allCmds.forEach(c => totalAliases += c.aliases.length);

        let text = `╭─⌈ 🔘 *INTERACTIVE BUTTON COMMANDS* ⌋\n│\n`;
        text += `├─⊷ Button Mode: ${buttonStatus}\n`;
        text += `├─⊷ Total Commands: *${totalMain}* (+${totalAliases} aliases)\n│\n`;

        for (const [catName, catCmdNames] of Object.entries(categoryMap)) {
            const catCmds = allCmds.filter(c => catCmdNames.includes(c.name));
            if (catCmds.length === 0) continue;
            const icon = catName === 'downloaders' ? '⬇️' : catName === 'ai' ? '🤖' : catName === 'group' ? '🏠' : catName === 'utility' ? '🔧' : catName === 'media' ? '🎵' : catName === 'fun' ? '🎮' : catName === 'owner' ? '👑' : catName === 'sports' ? '🏆' : '🕵️';
            text += `├─⌈ ${icon} *${catName.toUpperCase()}* (${catCmds.length}) ⌋\n`;
            catCmds.forEach(cmd => {
                text += `│  ├─ ${prefix}${cmd.name}`;
                if (cmd.aliases.length > 0) text += ` [${cmd.aliases.join(',')}]`;
                text += `\n`;
            });
            text += `│\n`;
        }

        const categorizedNames = new Set(Object.values(categoryMap).flat());
        const uncategorized = allCmds.filter(c => !categorizedNames.has(c.name));
        if (uncategorized.length > 0) {
            text += `├─⌈ 📦 *OTHER* (${uncategorized.length}) ⌋\n`;
            uncategorized.forEach(cmd => {
                text += `│  ├─ ${prefix}${cmd.name}\n`;
            });
            text += `│\n`;
        }

        text += `├─⊷ Use *${prefix}buttonmenu <category>*\n│  └⊷ to see button details per category\n`;
        text += `├─⊷ Toggle: *${prefix}mode buttons* / *${prefix}mode default*\n`;
        text += `╰───`;

        await sock.sendMessage(chatId, { text }, { quoted: m });
    }
};

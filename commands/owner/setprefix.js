import { getOwnerName } from '../../lib/menuHelper.js';
// File: ./commands/owner/setprefix.js
export default {
    name: 'setprefix',
    alias: ['setpre', 'changeprefix'],
    category: 'owner',
    description: 'Change bot prefix or enable prefixless mode (saved & persistent)',
    ownerOnly: true,
    
    async execute(sock, msg, args, PREFIX, extra) {
        const chatId = msg.key.remoteJid;
        const { jidManager, updatePrefix, getCurrentPrefix, isPrefixless } = extra;
        
        const isSudoUser = extra?.isSudo ? extra.isSudo() : false;
        if (!jidManager.isOwner(msg) && !isSudoUser) {
            return sock.sendMessage(chatId, {
                text: '❌ *Owner Only Command*'
            }, { quoted: msg });
        }
        
        if (!args[0]) {
            const currentPrefix = getCurrentPrefix();
            const prefixlessStatus = isPrefixless ? '✅ ENABLED' : '❌ DISABLED';
            
            return sock.sendMessage(chatId, {
                text: `╭─⌈ 🔧 *SET PREFIX* ⌋\n│\n│ 📌 Current: "${isPrefixless ? 'none (prefixless)' : currentPrefix}"\n│ Prefixless: ${prefixlessStatus}\n├─⊷ *${PREFIX}setprefix <new_prefix>*\n│  └⊷ Change prefix\n├─⊷ *${PREFIX}setprefix none*\n│  └⊷ Enable prefixless mode\n├─⊷ *${PREFIX}setprefix "."*\n│  └⊷ Set prefix to dot\n╰⊷ *Powered by ${getOwnerName().toUpperCase()} TECH*`
            }, { quoted: msg });
        }
        
        const newPrefix = args[0].trim();
        const isNone = newPrefix.toLowerCase() === 'none' || newPrefix === '""' || newPrefix === "''" || newPrefix === '';
        
        if (!isNone && newPrefix.length > 5) {
            return sock.sendMessage(chatId, {
                text: '❌ Prefix too long! Maximum 5 characters.'
            }, { quoted: msg });
        }
        
        try {
            const oldPrefix = getCurrentPrefix();
            const oldIsPrefixless = isPrefixless;
            
            // Update prefix immediately in memory AND save to files
            const updateResult = updatePrefix(newPrefix);
            
            if (!updateResult.success) {
                throw new Error('Failed to update prefix');
            }
            
            if (isNone) {
                // Prefixless mode enabled
                await sock.sendMessage(chatId, {
                    text: `✅ *PREFIXLESS MODE ENABLED*\n\nOld prefix: "${oldIsPrefixless ? 'none' : oldPrefix}"\nNew mode: No prefix required!\n`
                }, { quoted: msg });
            } else {
                // Regular prefix change
                await sock.sendMessage(chatId, {
                    text: `✅ *PREFIX UPDATED*\nOld prefix: "${oldIsPrefixless ? 'none (prefixless)' : oldPrefix}"\nNew prefix: "*${newPrefix}"*\n`
                }, { quoted: msg });
            }
            
            // Send test message
            setTimeout(async () => {
                try {
                    if (isNone) {
                        await sock.sendMessage(chatId, {
                            text: `🔧 *Test Prefixless Mode*\n\nTry: \`ping\` (no prefix needed!)`
                        });
                    } else {
                        await sock.sendMessage(chatId, {
                            text: `🔧 *Test New Prefix*\n\nTry: \`${newPrefix}ping\``
                        });
                    }
                } catch {
                    // Silent fail
                }
            }, 1000);
            
        } catch (error) {
            await sock.sendMessage(chatId, {
                text: `❌ Error: ${error.message}`
            }, { quoted: msg });
        }
    }
};
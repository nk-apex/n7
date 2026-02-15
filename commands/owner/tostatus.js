import { downloadContentFromMessage } from '@whiskeysockets/baileys';

export default {
    name: 'tostatus',
    alias: ['status', 'setstatus', 'updatestatus', 'mystatus', 'poststatus'],
    category: 'owner',
    description: 'Post content to your WhatsApp Status (Stories)',
    ownerOnly: true,

    async execute(sock, msg, args, PREFIX, extra) {
        const chatId = msg.key.remoteJid;
        const { jidManager } = extra;

        const isSudoUser = extra?.isSudo ? extra.isSudo() : false;
        if (!jidManager.isOwner(msg) && !isSudoUser) {
            return sock.sendMessage(chatId, {
                text: '❌ *Owner Only Command!*'
            }, { quoted: msg });
        }

        const quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        const commandText = msg.message?.conversation ||
            msg.message?.extendedTextMessage?.text || '';
        const textAfterCmd = commandText.replace(/^[=!#/.]?(tostatus|status|setstatus|updatestatus|mystatus|poststatus)\s*/i, '').trim();

        if (!quoted && !textAfterCmd && !msg.message?.imageMessage && !msg.message?.videoMessage) {
            return sock.sendMessage(chatId, {
                text: `📱 *POST TO STATUS*\n\n` +
                    `Post text, images, or videos to your WhatsApp Status.\n\n` +
                    `💡 *Usage:*\n` +
                    `• \`${PREFIX}tostatus Hello World!\` - Text status\n` +
                    `• Reply to image: \`${PREFIX}tostatus\`\n` +
                    `• Reply to video: \`${PREFIX}tostatus\`\n` +
                    `• Reply to text: \`${PREFIX}tostatus\`\n` +
                    `• Send image with caption: \`${PREFIX}tostatus My pic!\`\n\n` +
                    `📝 *Note:* Status visible to contacts for 24h`
            }, { quoted: msg });
        }

        try {
            let statusContent = {};
            let mediaType = 'Text';

            if (quoted) {
                const result = await this.processQuoted(quoted, textAfterCmd);
                statusContent = result.content;
                mediaType = result.mediaType;
            }
            else if (msg.message?.imageMessage) {
                const media = await this.downloadMedia(msg.message.imageMessage, 'image');
                statusContent = {
                    image: media.buffer,
                    caption: textAfterCmd || msg.message.imageMessage.caption || ''
                };
                mediaType = 'Image';
            }
            else if (msg.message?.videoMessage) {
                const media = await this.downloadMedia(msg.message.videoMessage, 'video');
                statusContent = {
                    video: media.buffer,
                    caption: textAfterCmd || msg.message.videoMessage.caption || ''
                };
                mediaType = 'Video';
            }
            else if (textAfterCmd) {
                statusContent = {
                    text: textAfterCmd,
                    font: 0,
                    backgroundColor: '#1b5e20'
                };
                mediaType = 'Text';
            }

            if (!statusContent.text && !statusContent.image && !statusContent.video) {
                return sock.sendMessage(chatId, {
                    text: '❌ No valid content to post!'
                }, { quoted: msg });
            }

            await sock.sendMessage(chatId, { react: { text: '⏳', key: msg.key } });

            console.log(`📱 [toStatus] Posting ${mediaType} to status@broadcast`);

            const statusOpts = {
                backgroundColor: statusContent.backgroundColor || '#1b5e20',
                font: statusContent.font || 0,
                statusJidList: await this.getStatusJidList(sock, msg)
            };

            delete statusContent.backgroundColor;
            delete statusContent.font;

            await sock.sendMessage('status@broadcast', statusContent, statusOpts);

            await sock.sendMessage(chatId, { react: { text: '✅', key: msg.key } });

            let confirmMsg = `✅ *Status Posted!*\n\n📊 Type: ${mediaType}\n`;
            if (statusContent.caption) {
                confirmMsg += `📝 Caption: ${statusContent.caption.substring(0, 60)}${statusContent.caption.length > 60 ? '...' : ''}\n`;
            }
            if (statusContent.text) {
                confirmMsg += `📄 Text: ${statusContent.text.substring(0, 60)}${statusContent.text.length > 60 ? '...' : ''}\n`;
            }
            confirmMsg += `⏰ Visible for 24 hours`;

            await sock.sendMessage(chatId, { text: confirmMsg }, { quoted: msg });
            console.log(`✅ [toStatus] ${mediaType} posted to status successfully`);

        } catch (error) {
            console.error('❌ [toStatus] Error:', error);
            await sock.sendMessage(chatId, { react: { text: '❌', key: msg.key } });
            await sock.sendMessage(chatId, {
                text: `❌ Failed to post status:\n${error.message}\n\n💡 Try smaller media (max 16MB for video, 30s max)`
            }, { quoted: msg });
        }
    },

    async processQuoted(quoted, caption) {
        let content = {};
        let mediaType = 'Text';

        if (quoted.imageMessage) {
            const media = await this.downloadMedia(quoted.imageMessage, 'image');
            content = { image: media.buffer, caption: caption || quoted.imageMessage.caption || '' };
            mediaType = 'Image';
        }
        else if (quoted.videoMessage) {
            const media = await this.downloadMedia(quoted.videoMessage, 'video');
            content = { video: media.buffer, caption: caption || quoted.videoMessage.caption || '' };
            mediaType = 'Video';
        }
        else if (quoted.stickerMessage) {
            const media = await this.downloadMedia(quoted.stickerMessage, 'sticker');
            content = { image: media.buffer, caption: caption || '' };
            mediaType = 'Sticker';
        }
        else if (quoted.conversation || quoted.extendedTextMessage?.text) {
            const quotedText = quoted.conversation || quoted.extendedTextMessage.text;
            const finalText = caption ? `${quotedText}\n\n${caption}` : quotedText;
            content = { text: finalText, font: 0, backgroundColor: '#1b5e20' };
            mediaType = 'Text';
        }

        return { content, mediaType };
    },

    async downloadMedia(message, type) {
        const stream = await downloadContentFromMessage(message, type);
        const chunks = [];
        for await (const chunk of stream) {
            chunks.push(chunk);
        }
        return {
            buffer: Buffer.concat(chunks),
            mimetype: message.mimetype || (type === 'image' ? 'image/jpeg' : type === 'video' ? 'video/mp4' : 'application/octet-stream')
        };
    },

    async getStatusJidList(sock, msg) {
        try {
            const myJid = sock.user?.id;
            if (!myJid) return undefined;

            const ownJid = myJid.split(':')[0] + '@s.whatsapp.net';
            const jidList = [ownJid];

            if (sock.store?.contacts) {
                for (const cJid of Object.keys(sock.store.contacts)) {
                    if (cJid.endsWith('@s.whatsapp.net') && !jidList.includes(cJid)) {
                        jidList.push(cJid);
                    }
                }
            }

            try {
                const groups = await sock.groupFetchAllParticipating();
                if (groups) {
                    for (const groupData of Object.values(groups)) {
                        if (groupData.participants) {
                            for (const p of groupData.participants) {
                                const pJid = p.id?.split(':')[0] + '@s.whatsapp.net';
                                if (pJid && !jidList.includes(pJid)) {
                                    jidList.push(pJid);
                                }
                            }
                        }
                    }
                }
            } catch (err) {
                console.log('[toStatus] Could not fetch group participants:', err.message);
            }

            console.log(`[toStatus] statusJidList: ${jidList.length} contacts`);
            return jidList.length > 1 ? jidList : undefined;
        } catch (err) {
            console.error('[toStatus] getStatusJidList error:', err.message);
            return undefined;
        }
    }
};

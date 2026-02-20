function formatBytes(bytes) {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function getMessageType(message) {
    if (!message) return 'Unknown';
    const types = {
        conversation: 'Text',
        extendedTextMessage: 'Text (Extended)',
        imageMessage: 'Image',
        videoMessage: 'Video',
        audioMessage: 'Audio',
        documentMessage: 'Document',
        stickerMessage: 'Sticker',
        contactMessage: 'Contact',
        contactsArrayMessage: 'Contacts',
        locationMessage: 'Location',
        liveLocationMessage: 'Live Location',
        templateMessage: 'Template',
        buttonsMessage: 'Buttons',
        listMessage: 'List',
        viewOnceMessage: 'View Once',
        viewOnceMessageV2: 'View Once V2',
        viewOnceMessageV2Extension: 'View Once V2 Ext',
        reactionMessage: 'Reaction',
        pollCreationMessage: 'Poll',
        pollCreationMessageV2: 'Poll V2',
        pollCreationMessageV3: 'Poll V3',
        pollUpdateMessage: 'Poll Update',
        protocolMessage: 'Protocol',
        orderMessage: 'Order',
        invoiceMessage: 'Invoice',
        productMessage: 'Product',
        groupInviteMessage: 'Group Invite',
        eventMessage: 'Event',
        newsletterAdminInviteMessage: 'Channel Admin Invite',
        ptvMessage: 'Video Note (PTV)',
        interactiveMessage: 'Interactive',
        highlyStructuredMessage: 'Highly Structured',
        templateButtonReplyMessage: 'Template Reply',
        listResponseMessage: 'List Response',
        buttonsResponseMessage: 'Buttons Response'
    };

    for (const [key, label] of Object.entries(types)) {
        if (message[key]) return label;
    }

    const keys = Object.keys(message).filter(k => !k.startsWith('message'));
    if (keys.length > 0) return keys[0].replace('Message', '').replace(/([A-Z])/g, ' $1').trim();
    return 'Unknown';
}

function extractMediaInfo(msg) {
    const mediaTypes = ['imageMessage', 'videoMessage', 'audioMessage', 'documentMessage', 'stickerMessage', 'ptvMessage'];
    for (const type of mediaTypes) {
        if (msg[type]) {
            const media = msg[type];
            const info = {};
            if (media.mimetype) info.mimetype = media.mimetype;
            if (media.fileLength) {
                const len = typeof media.fileLength === 'object' ? (media.fileLength.low || 0) : media.fileLength;
                info.size = formatBytes(len);
            }
            if (media.width) info.width = media.width;
            if (media.height) info.height = media.height;
            if (media.seconds) info.duration = `${media.seconds}s`;
            if (media.fileName) info.fileName = media.fileName;
            if (media.isAnimated !== undefined) info.animated = media.isAnimated ? 'Yes' : 'No';
            if (media.isAvatar !== undefined) info.avatar = media.isAvatar ? 'Yes' : 'No';
            if (media.isAiSticker !== undefined) info.aiSticker = media.isAiSticker ? 'Yes' : 'No';
            if (media.isLottie !== undefined) info.lottie = media.isLottie ? 'Yes' : 'No';
            if (media.ptt !== undefined) info.voiceNote = media.ptt ? 'Yes' : 'No';
            if (media.pageCount) info.pages = media.pageCount;
            if (media.gifPlayback) info.gif = 'Yes';
            return info;
        }
    }
    return null;
}

function extractTextContent(msg) {
    if (msg.conversation) return msg.conversation;
    if (msg.extendedTextMessage?.text) return msg.extendedTextMessage.text;
    if (msg.imageMessage?.caption) return msg.imageMessage.caption;
    if (msg.videoMessage?.caption) return msg.videoMessage.caption;
    if (msg.documentMessage?.caption) return msg.documentMessage.caption;
    if (msg.documentMessage?.title) return msg.documentMessage.title;
    if (msg.contactMessage?.displayName) return `Contact: ${msg.contactMessage.displayName}`;
    if (msg.locationMessage) {
        const loc = msg.locationMessage;
        return `Location: ${loc.degreesLatitude}, ${loc.degreesLongitude}${loc.name ? ` (${loc.name})` : ''}`;
    }
    if (msg.listMessage?.title) return msg.listMessage.title;
    if (msg.buttonsMessage?.contentText) return msg.buttonsMessage.contentText;
    if (msg.pollCreationMessage?.name) return `Poll: ${msg.pollCreationMessage.name}`;
    if (msg.pollCreationMessageV2?.name) return `Poll: ${msg.pollCreationMessageV2.name}`;
    if (msg.pollCreationMessageV3?.name) return `Poll: ${msg.pollCreationMessageV3.name}`;
    if (msg.reactionMessage?.text) return `Reaction: ${msg.reactionMessage.text}`;
    if (msg.groupInviteMessage?.groupName) return `Group Invite: ${msg.groupInviteMessage.groupName}`;
    if (msg.stickerMessage) return '(Sticker)';
    return null;
}

export default {
    name: 'quoted',
    alias: ['q', 'quotedmsg', 'quotedinfo', 'qmsg'],
    description: 'Show details of the quoted/replied message',
    category: 'utility',

    async execute(sock, m, args, prefix, extra) {
        const chatId = m.key.remoteJid;

        const contextInfo = m.message?.extendedTextMessage?.contextInfo ||
                           m.message?.imageMessage?.contextInfo ||
                           m.message?.videoMessage?.contextInfo ||
                           m.message?.stickerMessage?.contextInfo ||
                           m.message?.audioMessage?.contextInfo ||
                           m.message?.documentMessage?.contextInfo ||
                           m.message?.conversation?.contextInfo ||
                           null;

        const quotedMessage = contextInfo?.quotedMessage;
        if (!quotedMessage) {
            return sock.sendMessage(chatId, {
                text: `❌ *No quoted message found!*\n\nReply to a message and type *${prefix}quoted* to see its details.`
            }, { quoted: m });
        }

        const stanzaId = contextInfo.stanzaId || 'Unknown';
        const participant = contextInfo.participant || 'Unknown';
        const senderName = participant.split('@')[0];

        const msgType = getMessageType(quotedMessage);
        const textContent = extractTextContent(quotedMessage);
        const mediaInfo = extractMediaInfo(quotedMessage);

        let mentions = [];
        if (contextInfo.mentionedJid?.length) {
            mentions = contextInfo.mentionedJid;
        }
        const quotedContext = quotedMessage.extendedTextMessage?.contextInfo;
        if (quotedContext?.mentionedJid?.length) {
            mentions = quotedContext.mentionedJid;
        }

        let isViewOnce = false;
        const qKeys = Object.keys(quotedMessage);
        if (qKeys.some(k => k.includes('viewOnce') || k.includes('ViewOnce'))) {
            isViewOnce = true;
        }
        const innerMsg = quotedMessage.viewOnceMessage?.message ||
                        quotedMessage.viewOnceMessageV2?.message ||
                        quotedMessage.viewOnceMessageV2Extension?.message;
        if (innerMsg) {
            isViewOnce = true;
        }

        let isForwarded = false;
        for (const key of Object.keys(quotedMessage)) {
            if (quotedMessage[key]?.contextInfo?.isForwarded) {
                isForwarded = true;
                break;
            }
        }

        let text = `╭─⌈ 📋 *QUOTED MESSAGE INFO* ⌋\n│\n`;
        text += `│ 📌 *Message ID:* ${stanzaId.substring(0, 20)}${stanzaId.length > 20 ? '...' : ''}\n`;
        text += `│ 👤 *Sender:* @${senderName}\n`;
        text += `│ 📝 *Type:* ${msgType}\n`;

        if (isViewOnce) text += `│ 👁️ *View Once:* Yes\n`;
        if (isForwarded) text += `│ 🔄 *Forwarded:* Yes\n`;

        if (textContent) {
            const displayText = textContent.length > 300 ? textContent.substring(0, 300) + '...' : textContent;
            text += `│ 💬 *Content:*\n│   ${displayText.split('\n').join('\n│   ')}\n`;
        }

        if (mediaInfo) {
            text += `│\n│ 📎 *MEDIA DETAILS*\n`;
            if (mediaInfo.mimetype) text += `│   Format: ${mediaInfo.mimetype}\n`;
            if (mediaInfo.size) text += `│   Size: ${mediaInfo.size}\n`;
            if (mediaInfo.width && mediaInfo.height) text += `│   Dimensions: ${mediaInfo.width}x${mediaInfo.height}\n`;
            if (mediaInfo.duration) text += `│   Duration: ${mediaInfo.duration}\n`;
            if (mediaInfo.fileName) text += `│   File: ${mediaInfo.fileName}\n`;
            if (mediaInfo.pages) text += `│   Pages: ${mediaInfo.pages}\n`;
            if (mediaInfo.animated) text += `│   Animated: ${mediaInfo.animated}\n`;
            if (mediaInfo.avatar) text += `│   Avatar: ${mediaInfo.avatar}\n`;
            if (mediaInfo.aiSticker) text += `│   AI Sticker: ${mediaInfo.aiSticker}\n`;
            if (mediaInfo.lottie) text += `│   Lottie: ${mediaInfo.lottie}\n`;
            if (mediaInfo.voiceNote) text += `│   Voice Note: ${mediaInfo.voiceNote}\n`;
            if (mediaInfo.gif) text += `│   GIF Playback: Yes\n`;
        }

        if (mentions.length > 0) {
            text += `│\n│ 🏷️ *Mentions:* ${mentions.map(j => '@' + j.split('@')[0]).join(', ')}\n`;
        }

        const chatType = chatId.endsWith('@g.us') ? 'Group' : chatId.endsWith('@newsletter') ? 'Channel' : 'Private';
        text += `│\n│ 📍 *Chat:* ${chatType}\n`;
        text += `╰───────────────`;

        const mentionedJid = [participant, ...mentions].filter(Boolean);

        await sock.sendMessage(chatId, { text, mentions: mentionedJid }, { quoted: m });
    }
};

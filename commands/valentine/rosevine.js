import axios from 'axios';

const API_BASE = 'https://apiskeith.vercel.app';

export default {
    name: 'rosevine',
    alias: ['rosewine', 'rose'],
    category: 'valentine',
    description: 'Create a rose vine effect with text and image',

    async execute(sock, msg, args) {
        const chatId = msg.key.remoteJid;
        const quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        const hasImage = quoted?.imageMessage || msg.message?.imageMessage;

        if (!args.length && !hasImage) {
            return await sock.sendMessage(chatId, {
                text: `╭─⌈ 🌹 *ROSE VINE* ⌋\n│\n│ Create a rose vine effect\n│ with text and image\n│\n├─⊷ *Usage:*\n│ ${global.prefix || '.'}rosevine <text1> | <text2>\n│ _(reply to an image)_\n│\n├─⊷ *Example:*\n│ ${global.prefix || '.'}rosevine I Love You | Forever\n╰───`
            }, { quoted: msg });
        }

        const textParts = args.join(' ').split('|').map(t => t.trim());
        const text1 = textParts[0] || 'Love';
        const text2 = textParts[1] || '';

        let imageUrl = '';
        try {
            if (hasImage) {
                const imgMsg = quoted?.imageMessage || msg.message?.imageMessage;
                const buffer = await sock.downloadMediaMessage(quoted?.imageMessage ? { message: { imageMessage: imgMsg }, key: msg.key } : msg);
                const formData = new FormData();
                const blob = new Blob([buffer], { type: 'image/jpeg' });
                formData.append('file', blob, 'image.jpg');
                const upload = await axios.post('https://tmpfiles.org/api/v1/upload', formData, { timeout: 15000 });
                imageUrl = upload.data?.data?.url?.replace('tmpfiles.org/', 'tmpfiles.org/dl/') || '';
            }
        } catch {}

        await sock.sendMessage(chatId, { react: { text: '🌹', key: msg.key } });

        try {
            let url = `${API_BASE}/api/photofunia/generate?effect=rose-vine&text=${encodeURIComponent(text1)}`;
            if (text2) url += `&text2=${encodeURIComponent(text2)}`;
            if (imageUrl) url += `&imageUrl=${encodeURIComponent(imageUrl)}`;

            const res = await axios.get(url, { timeout: 30000 });
            const resultUrl = res.data?.url || res.data?.result || res.data?.image || res.data?.data?.url;

            if (!resultUrl) throw new Error('No image returned');

            const imgRes = await axios.get(resultUrl, { responseType: 'arraybuffer', timeout: 30000 });

            await sock.sendMessage(chatId, {
                image: Buffer.from(imgRes.data),
                caption: `🌹 *Rose Vine*\n\n_Created by WOLFBOT_`
            }, { quoted: msg });
        } catch (err) {
            await sock.sendMessage(chatId, {
                text: `❌ Failed to generate rose vine effect: ${err.message}`
            }, { quoted: msg });
        }
    }
};

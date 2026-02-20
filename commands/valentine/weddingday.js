import axios from 'axios';

const API_BASE = 'https://apiskeith.vercel.app';

export default {
    name: 'weddingday',
    alias: ['wedding'],
    category: 'valentine',
    description: 'Create a wedding day effect with your image',

    async execute(sock, msg, args) {
        const chatId = msg.key.remoteJid;
        const quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        const hasImage = quoted?.imageMessage || msg.message?.imageMessage;

        if (!hasImage) {
            return await sock.sendMessage(chatId, {
                text: `╭─⌈ 💒 *WEDDING DAY* ⌋\n│\n│ Create a wedding day effect\n│ with your image\n│\n├─⊷ *Usage:*\n│ ${global.prefix || '.'}weddingday\n│ _(reply to an image)_\n╰───`
            }, { quoted: msg });
        }

        await sock.sendMessage(chatId, { react: { text: '💒', key: msg.key } });

        try {
            const imgMsg = quoted?.imageMessage || msg.message?.imageMessage;
            const buffer = await sock.downloadMediaMessage(quoted?.imageMessage ? { message: { imageMessage: imgMsg }, key: msg.key } : msg);
            const formData = new FormData();
            const blob = new Blob([buffer], { type: 'image/jpeg' });
            formData.append('file', blob, 'image.jpg');
            const upload = await axios.post('https://tmpfiles.org/api/v1/upload', formData, { timeout: 15000 });
            const imageUrl = upload.data?.data?.url?.replace('tmpfiles.org/', 'tmpfiles.org/dl/') || '';

            if (!imageUrl) throw new Error('Failed to upload image');

            const url = `${API_BASE}/api/photofunia/generate?effect=wedding-day&imageUrl=${encodeURIComponent(imageUrl)}`;
            const res = await axios.get(url, { timeout: 30000 });
            const resultUrl = res.data?.url || res.data?.result || res.data?.image || res.data?.data?.url;

            if (!resultUrl) throw new Error('No image returned');

            const imgRes = await axios.get(resultUrl, { responseType: 'arraybuffer', timeout: 30000 });

            await sock.sendMessage(chatId, {
                image: Buffer.from(imgRes.data),
                caption: `💒 *Wedding Day*\n\n_Created by WOLFBOT_`
            }, { quoted: msg });
        } catch (err) {
            await sock.sendMessage(chatId, {
                text: `❌ Failed to generate wedding day effect: ${err.message}`
            }, { quoted: msg });
        }
    }
};

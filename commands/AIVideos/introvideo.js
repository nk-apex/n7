import axios from "axios";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function generateEphoto(url, textArray) {
    const apiEndpoints = [
        `https://api-photooxy.vercel.app/api/ephoto360?url=${encodeURIComponent(url)}&text=${encodeURIComponent(textArray[0])}`,
        `https://widipe.com/ephoto360?url=${encodeURIComponent(url)}&text=${encodeURIComponent(textArray[0])}`
    ];

    for (const endpoint of apiEndpoints) {
        try {
            const res = await axios.get(endpoint, { timeout: 15000 });
            const u = res.data?.url || res.data?.image || res.data?.result?.url || res.data?.result?.image;
            if (u) return u;
        } catch {}
    }

    try {
        const { ephoto } = await import('mumaker');
        const result = await ephoto(url, textArray);
        if (result && (result.url || result.image || result.img)) {
            return result.url || result.image || result.img;
        }
    } catch (err) {
        console.log(`[INTROVIDEO] mumaker failed: ${err.message}`);
    }

    return null;
}

export default {
    name: "introvideo",
    aliases: ["intro", "logointro", "introanimation", "videointro"],
    category: "Generator",
    description: "Create logo intro video with your text",

    async execute(sock, m, args, prefix) {
        const jid = m.key.remoteJid;

        await sock.sendMessage(jid, { react: { text: '⏳', key: m.key } });

        try {
            if (args.length === 0) {
                return sock.sendMessage(jid, {
                    text: `🎬 *LOGO INTRO VIDEO MAKER*\n\n📌 *Usage:* \`${prefix}introvideo text\`\n📝 *Example:* \`${prefix}introvideo WOLF\``
                }, { quoted: m });
            }

            let text = args.join(" ").trim();

            if (text.length > 30) {
                return sock.sendMessage(jid, {
                    text: "❌ Text is too long! Please use maximum 30 characters."
                }, { quoted: m });
            }

            console.log(`🎬 [INTROVIDEO] Generating for: "${text}"`);

            const statusMsg = await sock.sendMessage(jid, {
                text: `🎬 *Creating Intro Video:*\n"${text}"\n⏳ *Please wait...*`
            }, { quoted: m });

            const effectUrls = [
                "https://en.ephoto360.com/free-logo-intro-video-maker-online-558.html",
                "https://en.ephoto360.com/free-logo-intro-video-maker-online-582.html",
                "https://en.ephoto360.com/create-digital-glitch-text-effect-online-772.html"
            ];

            let resultUrl = null;
            let apiUsed = "";

            for (const effectUrl of effectUrls) {
                resultUrl = await generateEphoto(effectUrl, [text]);
                if (resultUrl) {
                    apiUsed = effectUrl.match(/(\d+)\.html/)?.[1] || "ephoto360";
                    break;
                }
            }

            if (!resultUrl) {
                await sock.sendMessage(jid, {
                    text: `❌ Failed to generate intro video for "${text}"\n\nPlease try:\n• Shorter text\n• Different text\n• Try again later`,
                    edit: statusMsg.key
                });
                await sock.sendMessage(jid, { react: { text: '❌', key: m.key } });
                return;
            }

            console.log(`✅ [INTROVIDEO] Got result from effect #${apiUsed}`);

            await sock.sendMessage(jid, {
                text: `🎬 *Creating Intro Video:*\n"${text}" ✅\n⬇️ *Downloading...*`,
                edit: statusMsg.key
            });

            const tempDir = path.join(__dirname, "../temp");
            if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

            const isVideo = /\.(mp4|webm|mov)/i.test(resultUrl);
            const ext = isVideo ? '.mp4' : '.jpg';
            const fileName = `intro_${Date.now()}${ext}`;
            const tempFile = path.join(tempDir, fileName);

            try {
                const response = await axios({
                    url: resultUrl,
                    method: 'GET',
                    responseType: 'arraybuffer',
                    timeout: 20000,
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                        'Accept': '*/*'
                    }
                });

                const buffer = Buffer.from(response.data);

                if (buffer.length === 0) throw new Error("Empty response");

                const fileSizeMB = (buffer.length / 1024 / 1024).toFixed(2);

                if (isVideo) {
                    fs.writeFileSync(tempFile, buffer);
                    await sock.sendMessage(jid, {
                        video: buffer,
                        caption: `🎬 *LOGO INTRO VIDEO*\n📝 *Text:* ${text}`,
                        mimetype: 'video/mp4'
                    }, { quoted: m });
                } else {
                    await sock.sendMessage(jid, {
                        image: buffer,
                        caption: `🎬 *LOGO INTRO EFFECT*\n📝 *Text:* ${text}`
                    }, { quoted: m });
                }

                if (fs.existsSync(tempFile)) try { fs.unlinkSync(tempFile); } catch {}

                await sock.sendMessage(jid, {
                    text: `✅ *Intro Created!*`,
                    edit: statusMsg.key
                });
                await sock.sendMessage(jid, { react: { text: '✅', key: m.key } });

                console.log(`✅ [INTROVIDEO] Success: "${text}" (${fileSizeMB}MB)`);

            } catch (downloadError) {
                console.error("❌ [INTROVIDEO] Download error:", downloadError.message);
                await sock.sendMessage(jid, {
                    text: `❌ Download failed. Direct link:\n🔗 ${resultUrl}\n\n*Text:* ${text}`,
                    edit: statusMsg.key
                });
                await sock.sendMessage(jid, { react: { text: '❌', key: m.key } });
            }

        } catch (error) {
            console.error("❌ [INTROVIDEO] ERROR:", error);
            await sock.sendMessage(jid, {
                text: `❌ Error: ${error.message}`
            }, { quoted: m });
            await sock.sendMessage(jid, { react: { text: '❌', key: m.key } });
        }
    }
};

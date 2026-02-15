import axios from 'axios';
import crypto from 'crypto';

function generateDeviceId() {
    return crypto.randomBytes(16).toString('hex').replace(/(.{8})(.{4})(.{4})(.{4})(.{12})/, '$1-$2-$3-$4-$5');
}

const positiveMessages = [
    "You're amazing just the way you are!",
    "Keep shining, the world needs your light.",
    "Your smile makes a difference!",
    "Today is a great day to be awesome!",
    "You're stronger than you think!",
    "The world is better with you in it!",
    "You've got this! I believe in you!",
    "Sending virtual hugs! You're loved!",
    "Your potential is limitless!",
    "Remember to take care of yourself today!",
    "You make a positive difference!",
    "Just wanted to remind you: You matter!",
    "Keep being your wonderful self!",
    "Your kindness makes waves!",
    "Don't forget how amazing you are!",
    "Dream big, you can achieve anything!",
    "You inspire everyone around you!",
    "Never give up, great things take time!",
    "You are braver than you believe!",
    "Stay positive, great things are coming!"
];

export default {
    name: "nglattack",
    aliases: ["nglflood", "nglspam", "ngl"],
    description: "Send anonymous messages to NGL link",
    category: "ethical hacking",

    async execute(sock, m, args) {
        const jid = m.key.remoteJid;

        if (args.length === 0) {
            return sock.sendMessage(jid, {
                text: `📝 *NGL Attack*\n\n` +
                    `*Usage:*\n` +
                    `• \`.nglattack <username> <count> [custom message]\`\n\n` +
                    `*Examples:*\n` +
                    `• \`.nglattack john 5\` — sends 5 random messages\n` +
                    `• \`.nglattack john 3 hello there\` — sends "hello there" 3 times\n\n` +
                    `*Max:* 20 messages per run\n` +
                    `*Note:* Username only, not the full link`
            }, { quoted: m });
        }

        let username = args[0];
        username = username.replace(/https?:\/\/(ngl\.link|ngl\.life)\//i, '').replace(/\//g, '').trim();

        if (!username) {
            return sock.sendMessage(jid, {
                text: '❌ Please provide a valid NGL username.'
            }, { quoted: m });
        }

        const count = Math.min(parseInt(args[1]) || 5, 20);
        const customMessage = args.length > 2 ? args.slice(2).join(' ') : null;

        const statusMsg = await sock.sendMessage(jid, {
            text: `📨 *NGL Attack*\n\n` +
                `👤 Target: ${username}\n` +
                `📬 Messages: ${count}\n` +
                `💬 Type: ${customMessage ? 'Custom' : 'Random positive'}\n\n` +
                `⏳ Sending...`
        }, { quoted: m });

        await sock.sendMessage(jid, { react: { text: '📨', key: m.key } });

        let successCount = 0;
        let failCount = 0;

        for (let i = 0; i < count; i++) {
            try {
                const message = customMessage || positiveMessages[Math.floor(Math.random() * positiveMessages.length)];
                const deviceId = generateDeviceId();

                const response = await axios({
                    method: 'POST',
                    url: 'https://ngl.link/api/submit',
                    data: new URLSearchParams({
                        username: username,
                        question: message,
                        deviceId: deviceId,
                        gameSlug: '',
                        referrer: ''
                    }).toString(),
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                        'Accept': '*/*',
                        'Origin': 'https://ngl.link',
                        'Referer': `https://ngl.link/${username}`
                    },
                    timeout: 15000,
                    validateStatus: (s) => s < 500
                });

                if (response.status >= 200 && response.status < 300) {
                    successCount++;
                } else {
                    failCount++;
                }

                if ((i + 1) % 3 === 0 || i === count - 1) {
                    await sock.sendMessage(jid, {
                        text: `📨 *NGL Attack*\n\n` +
                            `👤 Target: ${username}\n` +
                            `📬 Progress: ${i + 1}/${count}\n` +
                            `✅ Sent: ${successCount}\n` +
                            `❌ Failed: ${failCount}\n\n` +
                            `⏳ ${i < count - 1 ? 'Sending...' : 'Complete!'}`,
                        edit: statusMsg.key
                    });
                }

                if (i < count - 1) {
                    await new Promise(r => setTimeout(r, 1500 + Math.random() * 1500));
                }

            } catch (err) {
                failCount++;
                console.log(`[NGL] Message ${i + 1} failed: ${err.message}`);
            }
        }

        await sock.sendMessage(jid, {
            text: `📨 *NGL Attack Complete*\n\n` +
                `👤 Target: ${username}\n` +
                `📬 Total: ${count}\n` +
                `✅ Sent: ${successCount}\n` +
                `❌ Failed: ${failCount}\n\n` +
                `${successCount > 0 ? '🎉 Messages delivered!' : '⚠️ All messages failed. The username may be invalid or NGL may be rate-limiting.'}`,
            edit: statusMsg.key
        });

        await sock.sendMessage(jid, {
            react: { text: successCount > 0 ? '✅' : '❌', key: m.key }
        });
    }
};

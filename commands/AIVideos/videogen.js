import fetch from "node-fetch";

export default {
    name: "videogen",
    alias: ["video", "vgen"],
    desc: "Generate or fetch short videos from keywords",
    category: "Fun",
    usage: ".videogen <keyword>",

    async execute(sock, m) {
        const jid = m.key.remoteJid;
        const args = m.message?.conversation?.split(" ").slice(1) || [];

        if (!args.length) {
            return sock.sendMessage(jid, { text: `╭─⌈ 🎬 *VIDEO GENERATOR* ⌋\n│\n├─⊷ *.videogen <keyword>*\n│  └⊷ Generate or fetch short videos\n│\n├─⊷ *Example:*\n│  └⊷ .videogen wolf anime\n│\n╰───` }, { quoted: m });
        }

        const query = args.join(" ");

        try {
            const PEXELS_API_KEY = "YOUR_PEXELS_API_KEY"; // replace with your key

            // Fetch videos from Pexels
            const res = await fetch(`https://api.pexels.com/videos/search?query=${encodeURIComponent(query)}&per_page=3`, {
                headers: { Authorization: PEXELS_API_KEY }
            });

            const data = await res.json();

            if (!data.videos || !data.videos.length) {
                return sock.sendMessage(jid, { text: `❌ No videos found for "${query}"` }, { quoted: m });
            }

            // Pick a random video from results
            const video = data.videos[Math.floor(Math.random() * data.videos.length)];

            // Send video to WhatsApp
            await sock.sendMessage(jid, {
                video: { url: video.video_files[0].link },
                caption: `🎬 Video result for: "${query}"\n🐺 WolfBot Video`
            }, { quoted: m });

        } catch (err) {
            console.error("VideoGen error:", err);
            await sock.sendMessage(jid, { text: "⚠️ Failed to fetch video." }, { quoted: m });
        }
    }
};

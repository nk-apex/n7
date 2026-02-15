// import axios from "axios";
// import fs from "fs/promises";
// import path from "path";
// import { fileURLToPath } from "url";

// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

// export default {
//   name: "p",
//  // aliases: [ "speed"],
//   description: "Check bot ping and status",

//   async execute(sock, m, args, PREFIX) {
//     try {
//       const jid = m.key.remoteJid;
//       const sender = m.key.participant || m.key.remoteJid;

//       // Fake contact function
//       function createFakeContact(message) {
//         return {
//           key: {
//             participants: "0@s.whatsapp.net",
//             remoteJid: "status@broadcast",
//             fromMe: false,
//             id: "WOLFBOT"
//           },
//           message: {
//             contactMessage: {
//               vcard: `BEGIN:VCARD\nVERSION:3.0\nN:Sy;Bot;;;\nFN:WOLFBOT\nitem1.TEL;waid=${message.key.participant?.split('@')[0] || message.key.remoteJid.split('@')[0]}:${message.key.participant?.split('@')[0] || message.key.remoteJid.split('@')[0]}\nitem1.X-ABLabel:Ponsel\nEND:VCARD`
//             }
//           },
//           participant: "0@s.whatsapp.net"
//         };
//       }

//       const fkontak = createFakeContact(m);

//       // Record start time for ping calculation
//       const pingStartTime = Date.now();
      
//       // Read owner information from owner.json
//       let ownerInfo = {
//         jid: "",
//         number: "",
//         name: ""
//       };
      
//       try {
//         const ownerPath = path.join(__dirname, "../../owner.json");
//         const ownerData = await fs.readFile(ownerPath, "utf8");
//         const ownerDataJson = JSON.parse(ownerData);
        
//         ownerInfo.jid = ownerDataJson.OWNER_JID || ownerDataJson.OWNER_CLEAN_JID || "";
//         ownerInfo.number = ownerDataJson.OWNER_NUMBER || ownerDataJson.OWNER_CLEAN_NUMBER || "";
//         ownerInfo.name = ownerDataJson.OWNER_NAME || "Silent Wolf";
        
//         console.log(`📋 [PING] Owner info loaded: ${ownerInfo.name} | ${ownerInfo.number}`);
//       } catch (ownerError) {
//         console.error("❌ [PING] Failed to read owner.json:", ownerError.message);
//         // Fallback defaults
//         ownerInfo.name = "Silent Wolf";
//         ownerInfo.number = "254703397679";
//         ownerInfo.jid = "254703397679@s.whatsapp.net";
//       }

//       // Fetch GitHub user data for 7silent-wolf
//       const githubOwner = "7silent-wolf";
//       let githubData = {
//         avatar_url: "https://avatars.githubusercontent.com/u/10639145",
//         html_url: `https://github.com/${githubOwner}`,
//         name: "Silent Wolf"
//       };
      
//       try {
//         const githubUserUrl = `https://api.github.com/users/${githubOwner}`;
//         console.log(`🌐 [PING] Fetching GitHub data for: ${githubOwner}`);
        
//         const githubResponse = await axios.get(githubUserUrl, { 
//           timeout: 10000,
//           headers: { 
//             "User-Agent": "Silent-Wolf-Bot",
//             "Accept": "application/vnd.github.v3+json"
//           } 
//         });
        
//         githubData = githubResponse.data;
//         console.log(`✅ [PING] GitHub data fetched successfully`);
//       } catch (githubError) {
//         console.error("⚠️ [PING] GitHub API failed, using defaults:", githubError.message);
//       }

//       // Calculate ping/latency
//       const pingTime = Date.now() - pingStartTime;
      
//       // Get system information
//       const uptime = process.uptime();
//       const hours = Math.floor(uptime / 3600);
//       const minutes = Math.floor((uptime % 3600) / 60);
//       const seconds = Math.floor(uptime % 60);
      
//       // Calculate response quality
//       let responseQuality = "";
//       if (pingTime < 500) responseQuality = "⚡ Lightning Fast";
//       else if (pingTime < 1500) responseQuality = "🚀 Fast";
//       else if (pingTime < 3000) responseQuality = "🐢 Moderate";
//       else responseQuality = "🐌 Slow";

//       // Prepare text with all stats - WITH BORDERS
//       const text = `
// ╭━ *WOLFBOT STATUS* 🤖━╮
// ┃
// ┃  📡 *Performance Metrics:*
// ┃  ⏱️ *Response Time:* ${pingTime}ms
// ┃  ⚡ *Quality:* ${responseQuality}
// ┃  🐺 *Maintained by:* ${ownerInfo.name}
// ┃  📁 *GitHub:* ${githubOwner}
// ┃  🚀 *Bot Status:* Operational
// ╰━━━━━━━━━━━━━━╯
// `.trim();

//       await sock.sendMessage(
//         jid,
//         {
//           text,
//           contextInfo: {
//             mentionedJid: ownerInfo.jid ? [ownerInfo.jid] : [],
//             externalAdReply: {
//               title: "🐺 WolfBot Status",
//               body: `Ping: ${pingTime}ms • Uptime: ${hours}h ${minutes}m`,
//               mediaType: 1,
//               thumbnailUrl: githubData.avatar_url,
//               sourceUrl: githubData.html_url,
//               mediaUrl: `https://github.com/7silent-wolf/silentwolf`,
//               renderLargerThumbnail: true
//             },
//           },
//         },
//         { 
//           quoted: fkontak
//         }
//       );

//       console.log(`✅ [PING] Command executed - Latency: ${pingTime}ms | Quality: ${responseQuality}`);

//     } catch (err) {
//       console.error("❌ [PING] Command error:", err.message || err);
      
//       // Fallback with basic information - WITH BORDERS
//       const fallbackText = `
// ╭━━⚡ *BOT STATUS* ⚡━━╮
// ┃
// ┃  📡 *Response Time:* Calculating...
// ┃  💻 *Status:* Operational
// ┃  🐺 *Developer:* 7silent-wolf
// ┃  🔗 *GitHub:* 7silent-wolf/silentwolf
// ┃
// ╰━━━━━━━━━━━━━━━━━━━━╯
// `.trim();

//       try {
//         await sock.sendMessage(
//           m.key.remoteJid,
//           { 
//             text: fallbackText,
//             contextInfo: {
//               externalAdReply: {
//                 title: "WolfBot Status",
//                 body: "Bot is online • Basic metrics",
//                 mediaType: 1,
//                 thumbnailUrl: "https://avatars.githubusercontent.com/u/10639145",
//                 sourceUrl: "https://github.com/7silent-wolf/silentwolf"
//               }
//             }
//           },
//           { quoted: m }
//         );
//       } catch (sendError) {
//         console.error("❌ [PING] Failed to send fallback:", sendError.message);
//       }
//     }
//   },
// };







import axios from "axios";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default {
  name: "p",
 // aliases: [ "speed"],
  description: "Check bot ping and status",

  async execute(sock, m, args, PREFIX) {
    try {
      const jid = m.key.remoteJid;
      const sender = m.key.participant || m.key.remoteJid;

      // Fake contact function
      function createFakeContact(message) {
        return {
          key: {
            participants: "0@s.whatsapp.net",
            remoteJid: "status@broadcast",
            fromMe: false,
            id: "WOLFBOT"
          },
          message: {
            contactMessage: {
              vcard: `BEGIN:VCARD\nVERSION:3.0\nN:Sy;Bot;;;\nFN:WOLFBOT\nitem1.TEL;waid=${message.key.participant?.split('@')[0] || message.key.remoteJid.split('@')[0]}:${message.key.participant?.split('@')[0] || message.key.remoteJid.split('@')[0]}\nitem1.X-ABLabel:Ponsel\nEND:VCARD`
            }
          },
          participant: "0@s.whatsapp.net"
        };
      }

      const fkontak = createFakeContact(m);

      // Record start time for ping calculation
      const pingStartTime = Date.now();
      
      // Read owner information from owner.json
      let ownerInfo = {
        jid: "",
        number: "",
        name: ""
      };
      
      try {
        const ownerPath = path.join(__dirname, "../../owner.json");
        const ownerData = await fs.readFile(ownerPath, "utf8");
        const ownerDataJson = JSON.parse(ownerData);
        
        ownerInfo.jid = ownerDataJson.OWNER_JID || ownerDataJson.OWNER_CLEAN_JID || "";
        ownerInfo.number = ownerDataJson.OWNER_NUMBER || ownerDataJson.OWNER_CLEAN_NUMBER || "";
        ownerInfo.name = ownerDataJson.OWNER_NAME || "Silent Wolf";
        
        console.log(`📋 [PING] Owner info loaded: ${ownerInfo.name} | ${ownerInfo.number}`);
      } catch (ownerError) {
        console.error("❌ [PING] Failed to read owner.json:", ownerError.message);
        // Fallback defaults
        ownerInfo.name = "Silent Wolf";
        ownerInfo.number = "254703397679";
        ownerInfo.jid = "254703397679@s.whatsapp.net";
      }

      // Fetch GitHub user data for 7silent-wolf
      const githubOwner = "7silent-wolf";
      let githubData = {
        avatar_url: "https://avatars.githubusercontent.com/u/10639145",
        html_url: `https://github.com/${githubOwner}`,
        name: "Silent Wolf"
      };
      
      try {
        const githubUserUrl = `https://api.github.com/users/${githubOwner}`;
        console.log(`🌐 [PING] Fetching GitHub data for: ${githubOwner}`);
        
        const githubResponse = await axios.get(githubUserUrl, { 
          timeout: 10000,
          headers: { 
            "User-Agent": "Silent-Wolf-Bot",
            "Accept": "application/vnd.github.v3+json"
          } 
        });
        
        githubData = githubResponse.data;
        console.log(`✅ [PING] GitHub data fetched successfully`);
      } catch (githubError) {
        console.error("⚠️ [PING] GitHub API failed, using defaults:", githubError.message);
      }

      // Calculate ping/latency
      const pingTime = Date.now() - pingStartTime;
      
      // Get system information
      const uptime = process.uptime();
      const hours = Math.floor(uptime / 3600);
      const minutes = Math.floor((uptime % 3600) / 60);
      const seconds = Math.floor(uptime % 60);
      
      // Calculate response quality
      let responseQuality = "";
      if (pingTime < 500) responseQuality = "⚡ Lightning Fast";
      else if (pingTime < 1500) responseQuality = "🚀 Fast";
      else if (pingTime < 3000) responseQuality = "🐢 Moderate";
      else responseQuality = "🐌 Slow";

      // Prepare text with all stats - WITH BORDERS
      const text = `
`.trim();

      await sock.sendMessage(
        jid,
        {
          text,
          contextInfo: {
            mentionedJid: ownerInfo.jid ? [ownerInfo.jid] : [],
            externalAdReply: {
              title: "🐺 WolfBot Status",
              body: `Ping: ${pingTime}ms • Uptime: ${hours}h ${minutes}m`,
              mediaType: 1,
              thumbnailUrl: githubData.avatar_url,
              sourceUrl: githubData.html_url,
              mediaUrl: `https://github.com/7silent-wolf/silentwolf`,
              renderLargerThumbnail: true
            },
          },
        },
        { 
          quoted: fkontak
        }
      );

      console.log(`✅ [PING] Command executed - Latency: ${pingTime}ms | Quality: ${responseQuality}`);

    } catch (err) {
      console.error("❌ [PING] Command error:", err.message || err);
      
      // Fallback with basic information - WITH BORDERS
      const fallbackText = `
╭━━⚡ *BOT STATUS* ⚡━━╮
┃
┃  📡 *Response Time:* Calculating...
┃  💻 *Status:* Operational
┃  🐺 *Developer:* 7silent-wolf
┃  🔗 *GitHub:* 7silent-wolf/silentwolf
┃
╰━━━━━━━━━━━━━━━━━━━━╯
`.trim();

      try {
        await sock.sendMessage(
          m.key.remoteJid,
          { 
            text: fallbackText,
            contextInfo: {
              externalAdReply: {
                title: "WolfBot Status",
                body: "Bot is online • Basic metrics",
                mediaType: 1,
                thumbnailUrl: "https://avatars.githubusercontent.com/u/10639145",
                sourceUrl: "https://github.com/7silent-wolf/silentwolf"
              }
            }
          },
          { quoted: m }
        );
      } catch (sendError) {
        console.error("❌ [PING] Failed to send fallback:", sendError.message);
      }
    }
  },
};

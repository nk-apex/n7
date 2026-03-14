import fs from "fs";
import { getBotName } from '../../lib/botname.js';
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function parseVcardNumbers(vcard) {
    const numbers = [];
    const lines = vcard.split(/\r?\n/);
    for (const line of lines) {
        if (!line.toUpperCase().startsWith('TEL')) continue;
        const parts = line.split(':');
        if (parts.length < 2) continue;
        const raw = parts[parts.length - 1].trim().replace(/[+\s()\-]/g, '');
        if (/^\d{7,15}$/.test(raw)) numbers.push(raw);
    }
    return numbers;
}

function extractNumbersFromQuotedVcf(m) {
    const msgContent = m.message || {};

    const inner =
        msgContent.ephemeralMessage?.message ||
        msgContent.viewOnceMessage?.message ||
        msgContent.documentWithCaptionMessage?.message ||
        msgContent;

    if (inner.contactMessage?.vcard) {
        return parseVcardNumbers(inner.contactMessage.vcard);
    }

    if (inner.contactsArrayMessage?.contacts?.length) {
        const nums = [];
        for (const c of inner.contactsArrayMessage.contacts) {
            if (c.vcard) nums.push(...parseVcardNumbers(c.vcard));
        }
        return nums;
    }

    const ctxMsg =
        inner.extendedTextMessage?.contextInfo?.quotedMessage ||
        inner.imageMessage?.contextInfo?.quotedMessage ||
        inner.videoMessage?.contextInfo?.quotedMessage;

    if (ctxMsg) {
        if (ctxMsg.contactMessage?.vcard) {
            return parseVcardNumbers(ctxMsg.contactMessage.vcard);
        }
        if (ctxMsg.contactsArrayMessage?.contacts?.length) {
            const nums = [];
            for (const c of ctxMsg.contactsArrayMessage.contacts) {
                if (c.vcard) nums.push(...parseVcardNumbers(c.vcard));
            }
            return nums;
        }
    }

    return [];
}

async function sendGroupLinkButton(sock, targetJid, quotedMsg, groupName, inviteLink, memberCount) {
    const caption =
        `╭─⌈ ✅ *GROUP CREATED* ⌋\n│\n` +
        `│ ✧ *Name:* ${groupName}\n` +
        `│ ✧ *Members:* ${memberCount}\n` +
        `│ ✧ *Link:* ${inviteLink}\n│\n` +
        `╰⊷ *Powered by ${getBotName().toUpperCase()}*`;

    const buttons = [
        {
            name: 'cta_url',
            buttonParamsJson: JSON.stringify({
                display_text: '👥 View Group',
                url: inviteLink,
                merchant_url: inviteLink
            })
        },
        {
            name: 'cta_copy',
            buttonParamsJson: JSON.stringify({
                display_text: '📋 Copy Link',
                copy_code: inviteLink
            })
        }
    ];

    try {
        const { createRequire } = await import('module');
        const require = createRequire(import.meta.url);
        const { sendInteractiveMessage } = require('gifted-btns');

        await sendInteractiveMessage(sock, targetJid, {
            text: caption,
            footer: `🐺 ${getBotName()}`,
            interactiveButtons: buttons
        });
    } catch {
        await sock.sendMessage(targetJid, { text: caption }, { quoted: quotedMsg });
    }
}

export default {
  name: "creategroup",
  description: "Create WhatsApp groups automatically",
  category: "owner",
  ownerOnly: true,
  aliases: ["cg", "makegroup", "newgroup"],
  usage: "<GroupName>  or  reply to VCF: <GroupName>  or  <number(s)> <GroupName>",

  async execute(sock, m, args, PREFIX, extra) {
    const jid = m.key.remoteJid;
    const { jidManager } = extra;

    const reply = (text) => sock.sendMessage(jid, { text }, { quoted: m });

    const isOwner = jidManager.isOwner(m);
    if (!isOwner) return reply(`❌ *Owner only command.*`);

    if (args.length === 0 || args[0].toLowerCase() === "help") {
      return reply(
        `╭─⌈ 👥 *CREATE GROUP* ⌋\n│\n` +
        `├─⊷ *Name only (just you):*\n│  └⊷ \`${PREFIX}creategroup WOLF\`\n` +
        `├─⊷ *Reply to VCF contact:*\n│  └⊷ \`${PREFIX}creategroup GroupName\`\n` +
        `├─⊷ *Manual numbers:*\n│  └⊷ \`${PREFIX}creategroup 254xxx GroupName\`\n` +
        `├─⊷ *Multiple numbers:*\n│  └⊷ \`${PREFIX}creategroup 254xxx 254yyy GroupName\`\n` +
        `│\n` +
        `├─⊷ *-d "description"*\n│  └⊷ Set group description\n` +
        `├─⊷ *-a*\n│  └⊷ Announce-only mode\n` +
        `├─⊷ *-r*\n│  └⊷ Admin-only settings\n` +
        `╰⊷ *Powered by ${getBotName().toUpperCase()}*`
      );
    }

    try {
      // ====== PARSE ARGUMENTS ======
      const phoneRegex = /^\+?[\d]{7,15}$/;
      const rawNumbers = [];
      const nameWords = [];
      let description = "";
      let announcementsOnly = false;
      let restrict = false;

      for (let i = 0; i < args.length; i++) {
        const arg = args[i];

        if (arg === '-d' && args[i + 1]) {
          description = args[i + 1].replace(/"/g, '').trim();
          i++;
          continue;
        }
        if (arg === '-a') { announcementsOnly = true; continue; }
        if (arg === '-r') { restrict = true; continue; }

        const stripped = arg.replace(/[+\s()\-]/g, '');
        if (phoneRegex.test(stripped) && stripped.length >= 7) {
          rawNumbers.push(stripped);
        } else {
          nameWords.push(arg.replace(/"/g, ''));
        }
      }

      const groupName = nameWords.join(' ').trim() || `${getBotName()} Group`;

      // ====== VCF EXTRACTION (merges with any manual numbers) ======
      const vcfNumbers = extractNumbersFromQuotedVcf(m);
      for (const n of vcfNumbers) {
        if (!rawNumbers.includes(n)) rawNumbers.push(n);
      }

      // ====== VALIDATION ======
      if (groupName.length > 25) {
        return reply(
          `❌ *Group name too long!*\n\n` +
          `Maximum 25 characters — yours has ${groupName.length}.\n` +
          `💡 Shorten: \`${PREFIX}cg ${groupName.slice(0, 20)}\``
        );
      }

      // ====== PREPARE PARTICIPANTS ======
      // NOTE: Creator (bot) is added by WhatsApp automatically — do NOT include bot/owner JID
      // in the participants array or WhatsApp will reject with bad-request.
      const participants = rawNumbers.map(n => n + '@s.whatsapp.net');

      const srcLabel = vcfNumbers.length > 0
        ? `📋 ${vcfNumbers.length} contact(s) from VCF`
        : participants.length > 0
          ? `📞 ${participants.length} number(s)`
          : `👤 Just you (solo group)`;

      await reply(`⏳ *Creating "${groupName}"…*\n${srcLabel}`);

      // ====== CREATE GROUP ======
      // Pass participants array — can be empty (solo group with just creator)
      const group = await sock.groupCreate(groupName, participants);

      if (!group || !group.gid) throw new Error("No group ID returned — creation may have failed.");

      const groupJid = group.gid;

      // ====== CONFIGURE GROUP ======
      const botJid = sock.user?.id || sock.userID;
      try {
        if (botJid) await sock.groupParticipantsUpdate(groupJid, [botJid], "promote");
      } catch {}

      if (description) {
        try { await sock.groupUpdateDescription(groupJid, description); } catch {}
      }

      try {
        await sock.groupSettingUpdate(groupJid, announcementsOnly ? 'announcement' : 'not_announcement');
        await sock.groupSettingUpdate(groupJid, restrict ? 'locked' : 'unlocked');
      } catch {}

      // Welcome message inside new group
      await sock.sendMessage(groupJid, {
        text: `👋 *Welcome to ${groupName}!*\n\nCreated with ${getBotName()}.\n🤖 Prefix: ${PREFIX}`
      });

      // ====== GET INVITE LINK ======
      let inviteLink = null;
      try {
        const code = await sock.groupInviteCode(groupJid);
        if (code) inviteLink = `https://chat.whatsapp.com/${code}`;
      } catch {}

      // ====== SEND VIEW GROUP BUTTON ======
      const memberCount = participants.length + 1; // +1 for creator
      if (inviteLink) {
        await sendGroupLinkButton(sock, jid, m, groupName, inviteLink, memberCount);
      } else {
        await reply(
          `╭─⌈ ✅ *GROUP CREATED* ⌋\n│\n` +
          `│ ✧ *Name:* ${groupName}\n` +
          `│ ✧ *Members:* ${memberCount}\n` +
          `│ ✧ *Link:* Unavailable (promote bot to admin)\n│\n` +
          `╰⊷ *Powered by ${getBotName().toUpperCase()}*`
        );
      }

      // ====== LOG ======
      try {
        const logDir = path.join(__dirname, "../../logs");
        if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });
        const logFile = path.join(logDir, "groups.json");
        const existing = fs.existsSync(logFile) ? JSON.parse(fs.readFileSync(logFile, 'utf8')) : [];
        existing.push({
          id: groupJid, name: groupName,
          created: new Date().toISOString(),
          members: memberCount,
          vcfSource: vcfNumbers.length > 0,
          invite: inviteLink || 'unavailable'
        });
        fs.writeFileSync(logFile, JSON.stringify(existing, null, 2));
      } catch {}

    } catch (error) {
      let msg = `❌ *Failed to create group*\n\n`;

      if (error.message?.includes("bad-request") || error.message?.includes("400")) {
        msg +=
          `WhatsApp rejected the request.\n\n` +
          `*Common fixes:*\n` +
          `• Numbers must be registered on WhatsApp\n` +
          `• Include country code (e.g. \`254703397679\`)\n` +
          `• Try creating with just a name first:\n` +
          `  \`${PREFIX}creategroup ${args.filter(a => !/^\d/.test(a)).join(' ') || 'MyGroup'}\``;
      } else if (error.message?.includes("rate") || error.message?.includes("429")) {
        msg += `Rate limited — wait 1–2 minutes and retry.`;
      } else {
        msg += error.message;
      }

      await reply(msg);
    }
  },
};

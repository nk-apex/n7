import { normalizeMessageContent } from '@whiskeysockets/baileys';

// ── helpers ──────────────────────────────────────────────────────────────────

function safeJson(obj, indent = 2) {
    return JSON.stringify(obj, (key, val) => {
        if (val instanceof Uint8Array || Buffer.isBuffer(val)) {
            return `<Buffer ${val.length}B>`;
        }
        if (typeof val === 'bigint') return val.toString();
        return val;
    }, indent);
}

function detectVoMethod(raw) {
    if (!raw) return null;
    const media = ['imageMessage', 'videoMessage', 'audioMessage'];

    for (const mt of media) {
        if (raw[mt]?.viewOnce) return { method: 'direct-flag', mt };
    }

    const wrapperMsg = raw.viewOnceMessage?.message
        || raw.viewOnceMessageV2?.message
        || raw.viewOnceMessageV2Extension?.message;
    if (wrapperMsg) {
        for (const mt of media) {
            if (wrapperMsg[mt]) return { method: 'wrapper', mt };
        }
    }

    const eph = raw.ephemeralMessage?.message;
    if (eph) {
        const r = detectVoMethod(eph);
        if (r) return { method: `ephemeral>${r.method}`, mt: r.mt };
    }

    const norm = normalizeMessageContent(raw);
    if (norm && norm !== raw) {
        for (const mt of media) {
            if (norm[mt]?.viewOnce) return { method: 'normalize-flag', mt };
        }
        const hasWrapper = !!(raw.viewOnceMessage || raw.viewOnceMessageV2 || raw.viewOnceMessageV2Extension);
        if (hasWrapper) {
            for (const mt of media) {
                if (norm[mt]) return { method: 'wrapper+normalize', mt };
            }
        }
    }

    return null;
}

// Extract context info from any message type
function getContextInfo(msgObj) {
    if (!msgObj) return null;
    for (const key of Object.keys(msgObj)) {
        const sub = msgObj[key];
        if (sub?.contextInfo) return sub.contextInfo;
    }
    return null;
}

// ── command ──────────────────────────────────────────────────────────────────

export default {
    name: 'messagetype',
    aliases: ['msgtype', 'mtype'],
    category: 'owner',
    description: 'Debug: dump full message structure of the replied-to message (DM + group)',
    ownerOnly: true,

    async execute(sock, msg, args, PREFIX, extra) {
        const chatId = msg.key.remoteJid;
        const { jidManager, store } = extra;

        if (!jidManager.isOwner(msg)) {
            return sock.sendMessage(chatId, { text: '❌ *Owner Only Command!*' }, { quoted: msg });
        }

        // ── 1. Get quoted message id + partial content ─────────────────────
        const ctxInfo = getContextInfo(msg.message);
        const quotedPartial = ctxInfo?.quotedMessage;
        const quotedId = ctxInfo?.stanzaId;
        const quotedParticipant = ctxInfo?.participant || msg.key.remoteJid;

        if (!quotedPartial && !quotedId) {
            return sock.sendMessage(chatId, {
                text: '↩️ *Reply to any message* with `.messagetype` to inspect its structure.\n\n' +
                      'Works in both *DMs* and *Groups*.'
            }, { quoted: msg });
        }

        // ── 2. Try to get the FULL original message from store ─────────────
        let fullMsg = null;
        try {
            if (store && quotedId) {
                fullMsg = store.getMessage(chatId, quotedId)
                    || store.getMessage(quotedParticipant, quotedId)
                    || null;
            }
        } catch {}

        const rawFull = fullMsg?.message || null;
        const rawQuoted = quotedPartial || null;

        // ── 3. Build analysis for a given raw message object ───────────────
        function analyse(raw, label) {
            if (!raw) return `${label}: not available`;

            const topKeys = Object.keys(raw);
            const norm = normalizeMessageContent(raw);
            const normKeys = norm ? Object.keys(norm) : [];

            const wrappers = ['viewOnceMessage', 'viewOnceMessageV2', 'viewOnceMessageV2Extension', 'ephemeralMessage'];
            const foundWrappers = wrappers.filter(w => raw[w]);

            const innerLines = [];
            for (const w of foundWrappers) {
                const inner = raw[w]?.message;
                if (inner) {
                    Object.keys(inner).forEach(k => innerLines.push(`${w}.message.${k}`));
                }
            }

            const mediaTypes = ['imageMessage', 'videoMessage', 'audioMessage'];
            const directVo = mediaTypes.filter(mt => raw[mt]?.viewOnce === true);
            const normVo = mediaTypes.filter(mt => norm?.[mt]?.viewOnce === true);

            const det = detectVoMethod(raw);

            const lines = [
                `*${label}*`,
                `top keys: [${topKeys.join(', ')}]`,
            ];
            if (foundWrappers.length) lines.push(`wrappers: [${foundWrappers.join(', ')}]`);
            if (innerLines.length) lines.push(`inner keys: [${innerLines.join(', ')}]`);
            if (normKeys.join(',') !== topKeys.join(',')) lines.push(`normalized: [${normKeys.join(', ')}]`);
            if (directVo.length) lines.push(`viewOnce=true on: ${directVo.join(', ')}`);
            if (normVo.length) lines.push(`normalized viewOnce=true on: ${normVo.join(', ')}`);
            lines.push(det
                ? `✅ DETECTED — method: ${det.method}, type: ${det.mt}`
                : `❌ NOT detected as view-once`
            );
            return lines.join('\n');
        }

        // ── 4. Deep JSON dump of the raw structure (buffer-safe) ──────────
        function jsonDump(raw, label) {
            if (!raw) return null;
            const stripped = JSON.parse(safeJson(raw));
            return `*${label} (JSON)*\n\`\`\`json\n${safeJson(stripped)}\n\`\`\``;
        }

        // ── 5. Compose reply ───────────────────────────────────────────────
        const isGroup = chatId.endsWith('@g.us');
        const senderShort = quotedParticipant.split('@')[0].split(':')[0];

        let out = `*🔍 MESSAGE TYPE INSPECTOR*\n`;
        out += `Chat: ${isGroup ? 'Group' : 'DM'} | From: +${senderShort}\n`;
        if (quotedId) out += `MsgID: ${quotedId}\n`;
        out += `\n`;

        // Full message analysis first (most accurate)
        if (rawFull) {
            out += analyse(rawFull, '📦 Full message (from store)') + '\n\n';
        }

        // Quoted partial (always available)
        out += analyse(rawQuoted, rawFull ? '📎 Quoted partial (contextInfo)' : '📦 Message (contextInfo only)') + '\n';

        // JSON dump — prefer full, fall back to quoted partial
        const dumpTarget = rawFull || rawQuoted;
        const dumpLabel = rawFull ? 'Full message' : 'Quoted partial';
        const jsonSection = jsonDump(dumpTarget, dumpLabel);

        // Send summary first
        await sock.sendMessage(chatId, { text: out }, { quoted: msg });

        // Send JSON dump as separate message (can be long)
        if (jsonSection) {
            await sock.sendMessage(chatId, { text: jsonSection });
        }
    }
};

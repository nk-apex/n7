import { normalizeMessageContent } from '@whiskeysockets/baileys';

// ─── helpers ────────────────────────────────────────────────────────────────

function safeJson(obj) {
    return JSON.stringify(obj, (k, v) => {
        if (v instanceof Uint8Array || Buffer.isBuffer(v)) return `<Buffer ${v.length}B>`;
        if (typeof v === 'bigint') return v.toString();
        return v;
    }, 2);
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
        if (r) return { method: `ephemeral→${r.method}`, mt: r.mt };
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

function getCtxInfo(msgObj) {
    if (!msgObj) return null;
    for (const key of Object.keys(msgObj)) {
        const ctx = msgObj[key]?.contextInfo;
        if (ctx) return ctx;
    }
    return null;
}

// Check whether a media object has all required fields to attempt decryption
function checkDownloadReady(mediaObj) {
    if (!mediaObj) return { ready: false, missing: ['media object is null'] };
    const required = ['url', 'mediaKey', 'directPath', 'fileEncSha256'];
    const missing = required.filter(f => !mediaObj[f]);
    return { ready: missing.length === 0, missing };
}

// ─── command ────────────────────────────────────────────────────────────────

export default {
    name: 'messagetype',
    aliases: ['msgtype', 'mtype'],
    category: 'owner',
    description: 'Debug: full JSON structure + view-once analysis of any replied-to message',
    ownerOnly: true,

    async execute(sock, msg, args, PREFIX, extra) {
        const chatId = msg.key.remoteJid;
        const { jidManager, store } = extra;

        if (!jidManager.isOwner(msg)) {
            return sock.sendMessage(chatId, { text: '❌ *Owner Only Command!*' }, { quoted: msg });
        }

        // ── 1. Extract context info ──────────────────────────────────────
        const ctxInfo = getCtxInfo(msg.message);
        const quotedPartial = ctxInfo?.quotedMessage;
        const quotedId = ctxInfo?.stanzaId;
        const quotedParticipant = ctxInfo?.participant || msg.key.remoteJid;

        if (!quotedPartial && !quotedId) {
            return sock.sendMessage(chatId, {
                text: '↩️ *Reply to any message* with `.messagetype` to inspect its full structure.\n\nWorks in *DMs* and *Groups*.'
            }, { quoted: msg });
        }

        // ── 2. Full message from store (most accurate — present for fresh messages) ──
        let rawFull = null;
        try {
            if (store && quotedId) {
                const found = store.getMessage(chatId, quotedId)
                    || store.getMessage(quotedParticipant, quotedId);
                rawFull = found?.message || null;
            }
        } catch {}

        const rawQuoted = quotedPartial || null;
        const source = rawFull ? 'store (full)' : 'contextInfo (partial)';
        const raw = rawFull || rawQuoted;

        // ── 3. Analysis ──────────────────────────────────────────────────
        const topKeys = raw ? Object.keys(raw) : [];
        const norm = raw ? normalizeMessageContent(raw) : null;
        const normKeys = norm ? Object.keys(norm) : [];

        const wrappers = ['viewOnceMessage', 'viewOnceMessageV2', 'viewOnceMessageV2Extension', 'ephemeralMessage'];
        const foundWrappers = raw ? wrappers.filter(w => raw[w]) : [];

        const innerKeys = [];
        for (const w of foundWrappers) {
            const inner = raw[w]?.message;
            if (inner) Object.keys(inner).forEach(k => innerKeys.push(`${w}.message.${k}`));
        }

        const mediaTypes = ['imageMessage', 'videoMessage', 'audioMessage'];
        const directVo = raw ? mediaTypes.filter(mt => raw[mt]?.viewOnce === true) : [];
        const normVo = norm ? mediaTypes.filter(mt => norm[mt]?.viewOnce === true) : [];

        const det = raw ? detectVoMethod(raw) : null;

        // Determine the actual media object for download check
        let mediaObj = null;
        let mediaType = null;
        if (det) {
            if (det.method === 'direct-flag' || det.method === 'normalize-flag') {
                mediaObj = (rawFull || rawQuoted)?.[det.mt] || norm?.[det.mt];
            } else if (det.method.startsWith('wrapper') || det.method.startsWith('ephemeral')) {
                const wrapMsg = raw?.viewOnceMessage?.message
                    || raw?.viewOnceMessageV2?.message
                    || raw?.viewOnceMessageV2Extension?.message
                    || norm;
                mediaObj = wrapMsg?.[det.mt];
            }
            mediaType = det.mt?.replace('Message', '');
        }
        const dlCheck = checkDownloadReady(mediaObj);

        // ── 4. Summary message ───────────────────────────────────────────
        const isGroup = chatId.endsWith('@g.us');
        const senderNum = quotedParticipant.split('@')[0].split(':')[0];

        let summary = `*🔍 MESSAGE TYPE INSPECTOR*\n`;
        summary += `━━━━━━━━━━━━━━━━━━━━━\n`;
        summary += `*Chat:* ${isGroup ? '👥 Group' : '💬 DM'}\n`;
        summary += `*From:* +${senderNum}\n`;
        if (quotedId) summary += `*MsgID:* ${quotedId}\n`;
        summary += `*Source:* ${source}\n`;
        summary += `━━━━━━━━━━━━━━━━━━━━━\n\n`;

        summary += `*📦 Top-level keys (${topKeys.length}):*\n`;
        summary += topKeys.map(k => `  • \`${k}\``).join('\n') + '\n\n';

        if (foundWrappers.length) {
            summary += `*🔐 View-once wrappers found:*\n`;
            summary += foundWrappers.map(w => `  • \`${w}\``).join('\n') + '\n\n';
        }

        if (innerKeys.length) {
            summary += `*📂 Inner keys inside wrapper:*\n`;
            summary += innerKeys.map(k => `  • \`${k}\``).join('\n') + '\n\n';
        }

        if (normKeys.join(',') !== topKeys.join(',')) {
            summary += `*🔄 Normalized keys (${normKeys.length}):*\n`;
            summary += normKeys.map(k => `  • \`${k}\``).join('\n') + '\n\n';
        }

        if (directVo.length) {
            summary += `*👁 viewOnce=true (direct):* ${directVo.join(', ')}\n`;
        }
        if (normVo.length && normVo.join(',') !== directVo.join(',')) {
            summary += `*👁 viewOnce=true (normalized):* ${normVo.join(', ')}\n`;
        }
        if (directVo.length || normVo.length) summary += '\n';

        if (det) {
            summary += `*✅ VIEW-ONCE DETECTED*\n`;
            summary += `  Method: \`${det.method}\`\n`;
            summary += `  Media type: \`${det.mt}\`\n\n`;
            summary += `*📥 Download readiness:*\n`;
            if (dlCheck.ready) {
                summary += `  ✅ All required fields present\n`;
                summary += `  (url, mediaKey, directPath, fileEncSha256)\n`;
            } else {
                summary += `  ❌ Missing fields: ${dlCheck.missing.join(', ')}\n`;
            }
        } else {
            summary += `*❌ NOT detected as view-once*\n`;
            if (topKeys.some(k => mediaTypes.includes(k))) {
                summary += `  (has media but no viewOnce flag or wrapper)\n`;
            }
        }

        await sock.sendMessage(chatId, { text: summary }, { quoted: msg });

        // ── 5. JSON dump of the raw structure ────────────────────────────
        if (raw) {
            const jsonText = safeJson(JSON.parse(safeJson(raw)));
            const jsonMsg = `*📋 Raw Structure JSON* _(${source})_\n\`\`\`json\n${jsonText}\n\`\`\``;
            await sock.sendMessage(chatId, { text: jsonMsg });
        }

        // ── 6. If two sources available, dump the other one too ──────────
        if (rawFull && rawQuoted && rawFull !== rawQuoted) {
            const q = safeJson(JSON.parse(safeJson(rawQuoted)));
            await sock.sendMessage(chatId, {
                text: `*📋 Quoted partial (contextInfo) JSON*\n\`\`\`json\n${q}\n\`\`\``
            });
        }
    }
};

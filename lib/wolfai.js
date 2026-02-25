import { getBotName } from './botname.js';

const WOLF_TRIGGERS = [
  /^hey\s+wolf\b/i,
  /^yo\s+wolf\b/i,
  /^hi\s+wolf\b/i,
  /^hello\s+wolf\b/i,
  /^ok\s+wolf\b/i,
  /^okay\s+wolf\b/i,
  /^dear\s+wolf\b/i,
  /^wolf\b/i,
];

const INTENT_MAP = [
  {
    intent: 'menu',
    command: 'menu',
    patterns: [
      /\b(show|open|display|send|give|bring)\b.*\b(menu|commands?|list)\b/i,
      /\b(menu|commands?)\b.*\b(show|open|display|send)\b/i,
      /\bwhat\s+(can|commands?)\b/i,
      /\bmenu\b/i,
    ],
    extractArgs: () => [],
  },
  {
    intent: 'alive',
    command: 'alive',
    patterns: [
      /\b(are\s+you\s+alive|you\s+(there|alive|online|awake|up))\b/i,
      /\balive\b/i,
      /\b(status|running)\b/i,
    ],
    extractArgs: () => [],
  },
  {
    intent: 'ping',
    command: 'p',
    patterns: [
      /\b(ping|pong|speed|latency|response\s+time)\b/i,
      /\bhow\s+fast\b/i,
    ],
    extractArgs: () => [],
  },
  {
    intent: 'uptime',
    command: 'up',
    patterns: [
      /\b(uptime|how\s+long|running\s+for|been\s+on)\b/i,
    ],
    extractArgs: () => [],
  },
  {
    intent: 'sticker',
    command: 'sticker',
    patterns: [
      /\b(make|create|convert|turn).*\b(sticker|stick)\b/i,
      /\bsticker\b/i,
    ],
    extractArgs: () => [],
  },
  {
    intent: 'toimage',
    command: 'toimage',
    patterns: [
      /\b(convert|turn|make|change).*\b(image|photo|picture|img|pic)\b/i,
      /\bto\s*image\b/i,
    ],
    extractArgs: () => [],
  },
  {
    intent: 'play_song',
    command: 'play',
    patterns: [
      /\b(play|find|search|get)\b.*\b(song|music|track|audio)\b/i,
      /\bplay\s+(.+)/i,
    ],
    extractArgs: (text) => {
      const m = text.match(/(?:play|find|search|get)\s+(?:me\s+)?(?:the\s+)?(?:song|music|track|audio)?\s*(.+)/i);
      if (m && m[1]) return m[1].trim().split(/\s+/);
      const m2 = text.match(/(?:song|music|track|audio)\s+(?:called|named|by)?\s*(.+)/i);
      if (m2 && m2[1]) return m2[1].trim().split(/\s+/);
      return [];
    },
  },
  {
    intent: 'song',
    command: 'song',
    patterns: [
      /\b(download|dl)\b.*\b(song|music|audio|mp3)\b/i,
      /\b(song|music|audio|mp3)\b.*\b(download|dl)\b/i,
    ],
    extractArgs: (text) => {
      const m = text.match(/(?:download|dl)\s+(?:the\s+)?(?:song|music|audio|mp3)?\s*(.+)/i);
      if (m && m[1]) return m[1].trim().split(/\s+/);
      return [];
    },
  },
  {
    intent: 'video',
    command: 'ytmp4',
    patterns: [
      /\b(download|dl|get)\b.*\b(video|mp4|clip)\b/i,
      /\b(video|mp4|clip)\b.*\b(download|dl|get)\b/i,
    ],
    extractArgs: (text) => {
      const m = text.match(/(?:download|dl|get)\s+(?:the\s+)?(?:video|mp4|clip)?\s*(.+)/i);
      if (m && m[1]) return m[1].trim().split(/\s+/);
      return [];
    },
  },
  {
    intent: 'tiktok',
    command: 'tiktok',
    patterns: [
      /\b(download|dl|get|save)\b.*\btiktok\b/i,
      /\btiktok\b.*\b(download|dl|get|save)\b/i,
      /\btiktok\b/i,
    ],
    extractArgs: (text) => {
      const urlMatch = text.match(/(https?:\/\/[^\s]+)/i);
      if (urlMatch) return [urlMatch[1]];
      return [];
    },
  },
  {
    intent: 'gpt',
    command: 'gpt',
    patterns: [
      /\b(ask|tell|explain|help\s+me|what\s+is|what\s+are|who\s+is|how\s+to|how\s+do|why\s+is|why\s+do|can\s+you\s+explain|define)\b/i,
    ],
    extractArgs: (text) => {
      return text.trim().split(/\s+/);
    },
  },
  {
    intent: 'imagine',
    command: 'imagine',
    patterns: [
      /\b(generate|create|make|draw|imagine)\b.*\b(image|picture|photo|art|drawing)\b/i,
      /\b(image|picture|photo|art|drawing)\b.*\b(of|about|showing)\b/i,
      /\bimagine\b/i,
    ],
    extractArgs: (text) => {
      const m = text.match(/(?:generate|create|make|draw|imagine)\s+(?:an?\s+)?(?:image|picture|photo|art|drawing)?\s*(?:of|about|showing)?\s*(.+)/i);
      if (m && m[1]) return m[1].trim().split(/\s+/);
      return text.trim().split(/\s+/);
    },
  },
  {
    intent: 'mode',
    command: 'setsettings',
    patterns: [
      /\b(toggle|switch|change|set)\b.*\b(mode|bot\s*mode)\b.*\b(silent|public|groups?|dms?|private)\b/i,
      /\b(silent|public)\b.*\bmode\b/i,
    ],
    extractArgs: (text) => {
      const m = text.match(/\b(silent|public|groups?|dms?|private)\b/i);
      if (m) return ['mode', m[1].toLowerCase()];
      return ['mode'];
    },
  },
  {
    intent: 'mute',
    command: 'mute',
    patterns: [
      /\b(mute|silence)\b.*\b(group|chat|everyone)\b/i,
      /\bmute\b/i,
    ],
    extractArgs: () => [],
  },
  {
    intent: 'unmute',
    command: 'unmute',
    patterns: [
      /\b(unmute|unsilence)\b.*\b(group|chat|everyone)\b/i,
      /\bunmute\b/i,
    ],
    extractArgs: () => [],
  },
  {
    intent: 'kick',
    command: 'kick',
    patterns: [
      /\b(kick|remove|ban)\b.*\b(user|member|person|them|him|her)\b/i,
      /\bkick\b/i,
    ],
    extractArgs: (text) => {
      const mentions = text.match(/@\d+/g);
      if (mentions) return mentions;
      return [];
    },
  },
  {
    intent: 'promote',
    command: 'promote',
    patterns: [
      /\b(promote|make\s+admin)\b/i,
    ],
    extractArgs: () => [],
  },
  {
    intent: 'demote',
    command: 'demote',
    patterns: [
      /\b(demote|remove\s+admin)\b/i,
    ],
    extractArgs: () => [],
  },
  {
    intent: 'tagall',
    command: 'tagall',
    patterns: [
      /\b(tag\s*all|mention\s*all|call\s*everyone)\b/i,
    ],
    extractArgs: () => [],
  },
  {
    intent: 'antilink',
    command: 'antilink',
    patterns: [
      /\b(enable|disable|turn\s+on|turn\s+off|toggle|activate|deactivate)\b.*\bantilink\b/i,
      /\bantilink\b.*\b(enable|disable|turn\s+on|turn\s+off|toggle|on|off)\b/i,
    ],
    extractArgs: (text) => {
      if (/\b(enable|turn\s+on|activate|on)\b/i.test(text)) return ['on'];
      if (/\b(disable|turn\s+off|deactivate|off)\b/i.test(text)) return ['off'];
      return [];
    },
  },
  {
    intent: 'antibug',
    command: 'antibug',
    patterns: [
      /\b(enable|disable|turn\s+on|turn\s+off|toggle|activate|deactivate)\b.*\bantibug\b/i,
      /\bantibug\b.*\b(enable|disable|turn\s+on|turn\s+off|toggle|on|off)\b/i,
    ],
    extractArgs: (text) => {
      if (/\b(enable|turn\s+on|activate|on)\b/i.test(text)) return ['on'];
      if (/\b(disable|turn\s+off|deactivate|off)\b/i.test(text)) return ['off'];
      return [];
    },
  },
  {
    intent: 'weather',
    command: 'weather',
    patterns: [
      /\b(weather|temperature|forecast)\b/i,
      /\bhow.*\b(weather|cold|hot|warm)\b/i,
    ],
    extractArgs: (text) => {
      const m = text.match(/(?:weather|temperature|forecast)\s+(?:in|for|at)?\s*(.+)/i);
      if (m && m[1]) return m[1].trim().split(/\s+/);
      return [];
    },
  },
  {
    intent: 'joke',
    command: 'joke',
    patterns: [
      /\b(tell|say|give)\b.*\b(joke|funny|laugh)\b/i,
      /\bjoke\b/i,
      /\bmake\s+me\s+laugh\b/i,
    ],
    extractArgs: () => [],
  },
  {
    intent: 'quote',
    command: 'quote',
    patterns: [
      /\b(give|tell|send|share)\b.*\b(quote|inspiration|motivat)\b/i,
      /\bquote\b/i,
      /\binspire\s+me\b/i,
    ],
    extractArgs: () => [],
  },
  {
    intent: 'news',
    command: 'news',
    patterns: [
      /\b(latest|top|breaking|today)\b.*\bnews\b/i,
      /\bnews\b/i,
    ],
    extractArgs: () => [],
  },
  {
    intent: 'spotify',
    command: 'spotify',
    patterns: [
      /\bspotify\b/i,
    ],
    extractArgs: (text) => {
      const urlMatch = text.match(/(https?:\/\/[^\s]+)/i);
      if (urlMatch) return [urlMatch[1]];
      const m = text.match(/spotify\s+(.+)/i);
      if (m && m[1]) return m[1].trim().split(/\s+/);
      return [];
    },
  },
  {
    intent: 'facebook',
    command: 'facebook',
    patterns: [
      /\b(download|dl|get|save)\b.*\b(facebook|fb)\b/i,
      /\b(facebook|fb)\b.*\b(download|dl|get|save)\b/i,
    ],
    extractArgs: (text) => {
      const urlMatch = text.match(/(https?:\/\/[^\s]+)/i);
      if (urlMatch) return [urlMatch[1]];
      return [];
    },
  },
  {
    intent: 'owner',
    command: 'owner',
    patterns: [
      /\bwho\b.*\b(owner|creator|developer|made\s+you|created\s+you)\b/i,
      /\bowner\b/i,
    ],
    extractArgs: () => [],
  },
  {
    intent: 'restart',
    command: 'restart',
    patterns: [
      /\b(restart|reboot|reset)\b.*\b(bot|yourself|system)\b/i,
      /\brestart\b/i,
    ],
    extractArgs: () => [],
  },
  {
    intent: 'prefix',
    command: 'prefixinfo',
    patterns: [
      /\b(what|show|tell|current)\b.*\bprefix\b/i,
      /\bprefix\b/i,
    ],
    extractArgs: () => [],
  },
  {
    intent: 'grouplink',
    command: 'grouplink',
    patterns: [
      /\b(group|invite)\b.*\b(link|url)\b/i,
      /\bgroup\s*link\b/i,
    ],
    extractArgs: () => [],
  },
  {
    intent: 'screenshot',
    command: 'screenshot',
    patterns: [
      /\b(screenshot|ss|capture)\b.*\b(website|url|page|site)\b/i,
      /\bscreenshot\b/i,
    ],
    extractArgs: (text) => {
      const urlMatch = text.match(/(https?:\/\/[^\s]+)/i);
      if (urlMatch) return [urlMatch[1]];
      return [];
    },
  },
  {
    intent: 'whois',
    command: 'whois',
    patterns: [
      /\bwhois\b/i,
      /\b(lookup|check)\b.*\bdomain\b/i,
    ],
    extractArgs: (text) => {
      const m = text.match(/(?:whois|lookup|check)\s+(?:the\s+)?(?:domain\s+)?(.+)/i);
      if (m && m[1]) return m[1].trim().split(/\s+/);
      return [];
    },
  },
  {
    intent: 'remini',
    command: 'remini',
    patterns: [
      /\b(enhance|upscale|improve|hd|clear|sharpen)\b.*\b(image|photo|picture|pic)\b/i,
      /\bremini\b/i,
    ],
    extractArgs: () => [],
  },
  {
    intent: 'football',
    command: 'football',
    patterns: [
      /\b(football|soccer|premier\s+league|la\s+liga|champions\s+league)\b.*\b(score|result|match|live|standing)\b/i,
      /\bfootball\b/i,
    ],
    extractArgs: () => [],
  },
  {
    intent: 'cricket',
    command: 'cricket',
    patterns: [
      /\bcricket\b.*\b(score|result|match|live)\b/i,
      /\bcricket\b/i,
    ],
    extractArgs: () => [],
  },
  {
    intent: 'welcome',
    command: 'welcome',
    patterns: [
      /\b(enable|disable|turn\s+on|turn\s+off|toggle)\b.*\bwelcome\b/i,
      /\bwelcome\b.*\b(on|off|enable|disable)\b/i,
    ],
    extractArgs: (text) => {
      if (/\b(enable|turn\s+on|on)\b/i.test(text)) return ['on'];
      if (/\b(disable|turn\s+off|off)\b/i.test(text)) return ['off'];
      return [];
    },
  },
];

export function isWolfTrigger(text) {
  if (!text || typeof text !== 'string') return false;
  const trimmed = text.trim();
  return WOLF_TRIGGERS.some(r => r.test(trimmed));
}

export function stripWolfPrefix(text) {
  if (!text) return '';
  let stripped = text.trim();
  stripped = stripped.replace(/^(hey|yo|hi|hello|ok|okay|dear)\s+wolf\b\s*/i, '');
  stripped = stripped.replace(/^wolf\b\s*/i, '');
  stripped = stripped.replace(/^[,!.?\s]+/, '');
  return stripped.trim();
}

export function detectWolfIntent(text) {
  const cleaned = stripWolfPrefix(text);
  if (!cleaned) {
    return { intent: 'greet', command: null, args: [], cleaned };
  }

  for (const mapping of INTENT_MAP) {
    for (const pattern of mapping.patterns) {
      if (pattern.test(cleaned)) {
        const args = mapping.extractArgs ? mapping.extractArgs(cleaned) : [];
        return {
          intent: mapping.intent,
          command: mapping.command,
          args,
          cleaned,
        };
      }
    }
  }

  return {
    intent: 'chat',
    command: 'gpt',
    args: cleaned.split(/\s+/),
    cleaned,
  };
}

export function getGreetingResponse() {
  const botName = getBotName();
  const greetings = [
    `Hey there! I'm *${botName}* 🐺\nHow can I help you today?\n\nTry saying:\n• _Wolf show me the menu_\n• _Wolf play [song name]_\n• _Wolf what is the weather_\n• _Wolf tell me a joke_`,
    `Hi! *${botName}* at your service 🐺\nWhat would you like me to do?\n\nExamples:\n• _Wolf download this tiktok_\n• _Wolf toggle antilink on_\n• _Wolf who is the owner_\n• _Wolf explain quantum physics_`,
    `What's up! I'm *${botName}* 🐺\nJust tell me what you need!\n\nYou can say things like:\n• _Wolf ping_\n• _Wolf uptime_\n• _Wolf make a sticker_\n• _Wolf generate an image of a sunset_`,
  ];
  return greetings[Math.floor(Math.random() * greetings.length)];
}

export async function handleWolfAI(sock, msg, commands, executeCommand) {
  const text = extractText(msg);
  if (!text || !isWolfTrigger(text)) return false;

  const chatId = msg.key.remoteJid;
  const result = detectWolfIntent(text);

  if (result.intent === 'greet') {
    await sock.sendMessage(chatId, {
      text: getGreetingResponse(),
    }, { quoted: msg });
    return true;
  }

  if (result.command && commands.has(result.command)) {
    await executeCommand(result.command, result.args);
    return true;
  }

  if (result.intent === 'chat') {
    if (commands.has('gpt')) {
      await executeCommand('gpt', result.args);
      return true;
    }
  }

  await sock.sendMessage(chatId, {
    text: `🐺 I'm not sure how to do that. Try:\n• _Wolf show menu_ — see all commands\n• _Wolf play [song]_ — play music\n• _Wolf [question]_ — ask me anything`,
  }, { quoted: msg });
  return true;
}

function extractText(msg) {
  if (!msg?.message) return '';
  const m = msg.message;
  return m.conversation
    || m.extendedTextMessage?.text
    || m.imageMessage?.caption
    || m.videoMessage?.caption
    || m.documentMessage?.caption
    || '';
}

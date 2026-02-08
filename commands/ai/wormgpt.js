import axios from 'axios';

export default {
  name: 'wormgpt',
  description: 'WormGPT - Advanced AI assistant with no restrictions',
  category: 'ai',
  aliases: ['wgpt', 'evilgpt', 'darkai', 'unrestricted'],
  
  async execute(sock, m, args, PREFIX, extra) {
    const jid = m.key.remoteJid;
    
    if (args.length === 0 || args[0].toLowerCase() === 'help') {
      const helpText = `🤖 *WORMGPT*\n` +
        `⚡ *Advanced Unrestricted AI Assistant*\n` +
        `💡 *Usage:*\n` +
        `• \`${PREFIX}wormgpt your query\`\n`;
      return sock.sendMessage(jid, { text: helpText }, { quoted: m });
    }

    let query = args.join(' ');
    const statusMsg = await sock.sendMessage(jid, { text: `🤖 *WormGPT is thinking...*` }, { quoted: m });

    try {
      const apiUrl = `https://apiskeith.top/ai/wormgpt?q=${encodeURIComponent(query)}`;
      const response = await axios.get(apiUrl, { timeout: 60000 });
      
      let aiResponse = response.data?.result || response.data?.response || response.data?.message || (typeof response.data === 'string' ? response.data : 'No response from API');
      
      await sock.sendMessage(jid, {
        text: `🤖 *WORMGPT*\n\n📝 *Query:* ${query}\n\n⚡ *Response:*\n${aiResponse}`,
        edit: statusMsg.key
      });

    } catch (error) {
      console.error('WormGPT Error:', error);
      await sock.sendMessage(jid, { text: `❌ *WormGPT Error:* ${error.message}`, edit: statusMsg.key });
    }
  }
};

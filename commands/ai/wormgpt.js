import axios from 'axios';

export default {
  name: 'wormgpt',
  description: 'WormGPT - Advanced AI assistant with no restrictions',
  category: 'ai',
  aliases: ['wgpt', 'evilgpt', 'darkai', 'unrestricted'],
  
  async execute(sock, m, args, PREFIX, extra) {
    const jid = m.key.remoteJid;
    
    // ====== HELP SECTION ======
    if (args.length === 0 || args[0].toLowerCase() === 'help') {
      const helpText = `🤖 *WORMGPT*\n` +
        `⚡ *Advanced Unrestricted AI Assistant*\n` +
        `💡 *Usage:*\n` +
        `• \`${PREFIX}wormgpt your query\`\n` +
        `• \`${PREFIX}wormgpt hello\`\n` +
        `• \`${PREFIX}wgpt ask something\`\n` +
        ``;
      
      return sock.sendMessage(jid, { text: helpText }, { quoted: m });
    }

    let query = args.join(' ');
    
    // ====== PROCESSING MESSAGE ======
    const statusMsg = await sock.sendMessage(jid, {
      text: `🤖 *WORMGPT*\n` +
            `⚡ *Initializing WormGPT...*\n` +
            `📝 "${query.substring(0, 50)}${query.length > 50 ? '...' : ''}"`
    }, { quoted: m });

    try {
      console.log(`🤖 WormGPT Query: ${query}`);
      
      // ====== API REQUEST ======
      const apiUrl = 'https://apiskeith.vercel.app/ai/wormgpt';
      
      const response = await axios({
        method: 'GET',
        url: apiUrl,
        params: {
          q: query
        },
        timeout: 60000, // INCREASED TO 60 SECONDS
        headers: {
          'User-Agent': 'WhatsApp-Bot/1.0',
          'Accept': 'application/json',
          'X-Requested-With': 'WhatsApp-Bot',
          'Referer': 'https://apiskeith.vercel.app/',
          'Cache-Control': 'no-cache'
        },
        validateStatus: function (status) {
          return status >= 200 && status < 500;
        }
      });

      console.log(`✅ WormGPT Response status: ${response.status}`);
      
      // ====== UPDATE STATUS ======
      await sock.sendMessage(jid, {
        text: `🤖 *WORMGPT*\n` +
              `⚡ *Processing your query...*\n` +
              `⏳ Please wait...`,
        edit: statusMsg.key
      });

      // ====== PARSE RESPONSE ======
      let aiResponse = '';
      
      // Parse Keith API response format
      if (response.data && typeof response.data === 'object') {
        const data = response.data;
        
        // Extract based on Keith API structure
        if (data.status === true && data.result) {
          aiResponse = data.result;
        } else if (data.response) {
          aiResponse = data.response;
        } else if (data.answer) {
          aiResponse = data.answer;
        } else if (data.solution) {
          aiResponse = data.solution;
        } else if (data.text) {
          aiResponse = data.text;
        } else if (data.message) {
          aiResponse = data.message;
        } else if (data.error) {
          // API returned an error
          throw new Error(data.error || 'WormGPT API error');
        } else {
          // Try to extract any text
          aiResponse = extractWormGPTResponse(data);
        }
      } else if (typeof response.data === 'string') {
        aiResponse = response.data;
      } else {
        throw new Error('Invalid API response format');
      }
      
      // Check if response is empty or indicates error
      if (!aiResponse || aiResponse.trim() === '') {
        throw new Error('WormGPT returned empty response');
      }
      
      // Clean response
      aiResponse = aiResponse.trim();
      
      // Check for error indicators
      if (aiResponse.toLowerCase().includes('error') || 
          aiResponse.toLowerCase().includes('failed') ||
          aiResponse.toLowerCase().includes('unavailable')) {
        throw new Error(aiResponse);
      }
      
      // Truncate if too long for WhatsApp
      if (aiResponse.length > 2500) {
        aiResponse = aiResponse.substring(0, 2500) + '\n\n... (response truncated)';
      }

      // ====== FORMAT FINAL MESSAGE ======
      let resultText = `🤖 *WORMGPT*\n\n`;
      
      // Query
      const displayQuery = query.length > 80 ? query.substring(0, 80) + '...' : query;
      resultText += `📝 *Query:* ${displayQuery}\n\n`;
      
      // WormGPT Response
      resultText += `⚡ *WormGPT Response:*\n${aiResponse}\n\n`;
      
      // Footer
      resultText += `🔓 *Unrestricted AI | Powered by Keith API*`;

      // ====== SEND FINAL ANSWER ======
      await sock.sendMessage(jid, {
        text: resultText,
        edit: statusMsg.key
      });

    } catch (error) {
      console.error('❌ [WormGPT] ERROR:', error);
      
      let errorMessage = `❌ *WORMGPT ERROR*\n\n`;
      
      if (error.code === 'ECONNREFUSED') {
        errorMessage += `• WormGPT API server is down\n`;
        errorMessage += `• Please try again later\n`;
      } else if (error.code === 'ETIMEDOUT') {
        errorMessage += `• Request timed out (60s)\n`; // UPDATED
        errorMessage += `• Try simpler query\n`;
      } else if (error.code === 'ENOTFOUND') {
        errorMessage += `• Cannot connect to WormGPT API\n`;
        errorMessage += `• Check internet connection\n`;
      } else if (error.response?.status === 429) {
        errorMessage += `• Rate limit exceeded\n`;
        errorMessage += `• Too many WormGPT requests\n`;
        errorMessage += `• Wait 1-2 minutes\n`;
      } else if (error.response?.status === 404) {
        errorMessage += `• WormGPT endpoint not found\n`;
        errorMessage += `• API may have changed\n`;
      } else if (error.response?.status === 500) {
        errorMessage += `• WormGPT internal error\n`;
        errorMessage += `• Try different query\n`;
      } else if (error.response?.status === 400) {
        errorMessage += `• Bad request to WormGPT\n`;
        errorMessage += `• Query may be malformed\n`;
      } else if (error.response?.data) {
        // Extract API error
        const apiError = error.response.data;
        if (apiError.error) {
          errorMessage += `• WormGPT Error: ${apiError.error}\n`;
        } else if (apiError.message) {
          errorMessage += `• Error: ${apiError.message}\n`;
        } else if (typeof apiError === 'string') {
          errorMessage += `• Error: ${apiError}\n`;
        }
      } else if (error.message) {
        errorMessage += `• Error: ${error.message}\n`;
      }
      
      errorMessage += `\n🔧 *Troubleshooting:*\n`;
      errorMessage += `1. Use simpler, shorter queries\n`;
      errorMessage += `2. Wait 1 minute before retry\n`;
      errorMessage += `3. Check query formatting\n`;
      errorMessage += `4. Try \`${PREFIX}blackbox\` or \`${PREFIX}chatgpt\` alternatives\n`;
      
      // Try to send error message
      try {
        if (m.messageId) {
          await sock.sendMessage(jid, {
            text: errorMessage,
            edit: m.messageId
          });
        } else {
          await sock.sendMessage(jid, {
            text: errorMessage
          }, { quoted: m });
        }
      } catch (sendError) {
        console.error('Failed to send error message:', sendError);
      }
    }
  }
};

// ====== HELPER FUNCTIONS ======

// Extract text from WormGPT API response
function extractWormGPTResponse(obj) {
  // Prioritize common response fields
  const priorityFields = ['result', 'response', 'answer', 'text', 'content', 'message', 'output'];
  
  for (const field of priorityFields) {
    if (obj[field] && typeof obj[field] === 'string') {
      return obj[field];
    }
  }
  
  // If no string field found, try to extract from nested objects
  if (obj.data) {
    return extractWormGPTResponse(obj.data);
  }
  
  // If array with items, join them
  if (Array.isArray(obj) && obj.length > 0) {
    return obj.map(item => 
      typeof item === 'string' ? item : JSON.stringify(item)
    ).join('\n');
  }
  
  // Last resort: stringify with limit
  return JSON.stringify(obj, null, 2).substring(0, 2000);
}
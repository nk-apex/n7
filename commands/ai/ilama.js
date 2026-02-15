import axios from 'axios';

export default {
  name: "ilama",
  aliases: ["llama", "ai", "ask", "chat"],
  category: "ai",
  description: "AI chatbot powered by Llama",
  
  async execute(sock, m, args, PREFIX) {
    const jid = m.key.remoteJid;
    
    // Check if query is provided
    if (args.length === 0) {
      return sock.sendMessage(jid, {
        text: `🤖 *LLAMA AI CHATBOT*\n\n` +
              `❌ Please provide a query/question\n\n` +
              `📌 *Usage:* \`${PREFIX}ilama your question\`\n` +
              `📝 *Examples:*\n` +
              `• \`${PREFIX}ilama What is quantum computing?\`\n` +
              `• \`${PREFIX}ilama Explain machine learning\`\n` +
               `✨ Powered by Llama AI model`
      }, { quoted: m });
    }

    const query = args.join(' ');
    const encodedQuery = encodeURIComponent(query);
    
    try {
      // Show thinking status
      const statusMsg = await sock.sendMessage(jid, {
        text: `🤖 *Thinking...*\n\n` +
              `💭 *Question:* "${query}"\n` +
             ``
      }, { quoted: m });

      // Call Llama API
      const apiUrl = `https://apiskeith.vercel.app/ai/ilama?q=${encodedQuery}`;
      
      console.log(`[ILAMA] Query: "${query}"`);
      
      const response = await axios.get(apiUrl, {
        timeout: 30000,
        headers: {
          'User-Agent': 'WolfBot/1.0',
          'Accept': 'application/json'
        }
      });

      if (!response.data?.status || !response.data.result) {
        throw new Error('No valid response from AI');
      }

      const aiResponse = response.data.result;
      
      // Format AI response
      let formattedResponse = `🤖 *LLAMA AI RESPONSE*\n\n`;
      formattedResponse += `💭 *Your Question:*\n${query}\n\n`;
      formattedResponse += `💡 *AI Answer:*\n${aiResponse}\n\n`;
      formattedResponse += `━━━━━━━━━━━━━━━━━━━━\n`;
      formattedResponse += `🎯 *Model:* Llama AI\n`;
     // formattedResponse += `✨ *Powered by:* apiskeith.vercel.app`;

      // Send AI response
      await sock.sendMessage(jid, {
        text: formattedResponse
      }, { quoted: m });

      // Update status message
      await sock.sendMessage(jid, {
        text: `💭 *Question:* "${query}"\n` +
              `📝 *Response sent above*\n` +
            ``,
        edit: statusMsg.key
      });

      // Send success reaction
      await sock.sendMessage(jid, {
        react: { text: '✅', key: m.key }
      });

    } catch (error) {
      console.error('[ILAMA] Error:', error.message);
      
      let errorMessage = `❌ *AI Query Failed*\n\n`;
      
      if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
        errorMessage += `• AI service is unavailable\n`;
        errorMessage += `• Try again later\n\n`;
      } else if (error.response) {
        if (error.response.status === 404) {
          errorMessage += `• API endpoint not found\n\n`;
        } else if (error.response.status === 500) {
          errorMessage += `• AI server error\n`;
          errorMessage += `• Try rephrasing your question\n\n`;
        } else {
          errorMessage += `• API Error: ${error.response.status}\n\n`;
        }
      } else if (error.code === 'ETIMEDOUT') {
        errorMessage += `• AI response timeout\n`;
        errorMessage += `• Try simpler question\n`;
        errorMessage += `• AI might be busy\n\n`;
      } else if (error.message.includes('No valid response')) {
        errorMessage += `• AI returned empty response\n`;
        errorMessage += `• Try different wording\n\n`;
      } else {
        errorMessage += `• Error: ${error.message}\n\n`;
      }
      
      errorMessage += `💡 *Tips for better AI responses:*\n`;
      errorMessage += `• Be clear and specific\n`;
      errorMessage += `• Ask one question at a time\n`;
      errorMessage += `• Avoid ambiguous questions\n`;
      errorMessage += `• Use proper English\n\n`;
      
      errorMessage += `📌 *Usage:* \`${PREFIX}ilama your question\`\n`;
      errorMessage += `📝 *Example:* \`${PREFIX}ilama What is artificial intelligence?\``;
      
      await sock.sendMessage(jid, {
        text: errorMessage
      }, { quoted: m });
      
      // Send error reaction
      await sock.sendMessage(jid, {
        react: { text: '❌', key: m.key }
      });
    }
  }
};
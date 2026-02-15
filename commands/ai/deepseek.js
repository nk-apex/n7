// import axios from "axios";

// export default {
//   name: "deepseek",
//   category: "AI",
//   aliases: ["deep", "dseek", "dsai"],
//   description: "Query DeepSeek AI via Keith's API",
  
//   async execute(sock, m, args, PREFIX) {
//     const jid = m.key.remoteJid;
//     const quoted = m.quoted;
//     let query = "";

//     // Get query from arguments or quoted message
//     if (args.length > 0) {
//       query = args.join(" ");
//     } else if (quoted && quoted.text) {
//       query = quoted.text;
//     } else {
//       await sock.sendMessage(jid, { 
//         text: `🤖 *DeepSeek AI*\n\n` +
//               `💡 *Usage:*\n` +
//               `• \`${PREFIX}deepseek your question\`\n` +
//               `• \`${PREFIX}deepseek explain something\`\n` +
//               `• Reply to a message with \`${PREFIX}deepseek\`\n\n` +
//               `📌 *Examples:*\n` +
//               `• \`${PREFIX}deepseek What is artificial intelligence?\`\n` +
//               `• \`${PREFIX}deepseek How does machine learning work?\`\n` +
//               `• \`${PREFIX}deep Write Python code for calculator\`\n` +
//               `• Reply to a text with \`${PREFIX}deepseek\`\n\n` +
//               `🔤 *Aliases:* ${PREFIX}deep, ${PREFIX}dseek, ${PREFIX}dsai\n\n` +
//               `🚀 *Features:* Strong in coding, math, and reasoning`
//       }, { quoted: m });
//       return;
//     }

//     console.log(`🤖 [DEEPSEEK] Query: "${query}"`);

//     try {
//       // Send initial status
//       const statusMsg = await sock.sendMessage(jid, { 
//         text: `🤖 *DEEPSEEK AI*\n` +
//               `⚡ *Connecting to DeepSeek...*\n` +
//               `💭 "${query.substring(0, 50)}${query.length > 50 ? '...' : ''}"`
//       }, { quoted: m });

//       let deepseekResponse = '';
//       let apiUsed = '';
//       let fallbackUsed = false;
      
//       // Try primary Keith API
//       try {
//         const apiUrl = `https://apiskeith.vercel.app/ai/deepseek?q=${encodeURIComponent(query)}`;
//         console.log(`🌐 [DEEPSEEK] Trying primary API: ${apiUrl}`);
        
//         const response = await axios({
//           method: 'GET',
//           url: apiUrl,
//           timeout: 25000,
//           headers: {
//             'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
//             'Accept': 'application/json'
//           }
//         });

//         console.log(`✅ [DEEPSEEK] Primary API response status: ${response.status}`);
        
//         if (response.data && typeof response.data === 'object') {
//           const data = response.data;
          
//           console.log('📊 DeepSeek API Response keys:', Object.keys(data));
          
//           // Check for busy server error
//           if (data.error) {
//             console.log('❌ API returned error:', data.error);
//             throw new Error(data.error);
//           }
          
//           if (data.status === true && data.result) {
//             deepseekResponse = data.result;
//             apiUsed = 'Keith DeepSeek API';
//             console.log('✅ Using data.result');
//           } else if (data.response) {
//             deepseekResponse = data.response;
//             apiUsed = 'Keith DeepSeek API';
//             console.log('✅ Using data.response');
//           } else {
//             throw new Error('Invalid response format from primary API');
//           }
//         } else {
//           throw new Error('Invalid response from primary API');
//         }
        
//       } catch (primaryError) {
//         console.log(`⚠️ [DEEPSEEK] Primary API failed: ${primaryError.message}`);
        
//         // Try alternative AI APIs
//         const alternativeAPIs = [
//           {
//             name: 'Alternative GPT API',
//             url: `https://apiskeith.vercel.app/ai/gpt?q=${encodeURIComponent(query)}`
//           },
//           {
//             name: 'Claude AI API',
//             url: `https://apiskeith.vercel.app/ai/claudeai?q=${encodeURIComponent(query)}`
//           },
//           {
//             name: 'General AI API',
//             url: `https://api.beautyofweb.com/gpt4?q=${encodeURIComponent(query)}`
//           }
//         ];
        
//         for (const api of alternativeAPIs) {
//           try {
//             console.log(`🔄 [DEEPSEEK] Trying alternative: ${api.name}`);
            
//             const altResponse = await axios({
//               method: 'GET',
//               url: api.url,
//               timeout: 20000,
//               headers: {
//                 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
//                 'Accept': 'application/json'
//               }
//             });
            
//             if (altResponse.data && typeof altResponse.data === 'object') {
//               const data = altResponse.data;
              
//               if (data.status === true && data.result) {
//                 deepseekResponse = data.result;
//                 apiUsed = `${api.name} (DeepSeek alternative)`;
//                 fallbackUsed = true;
//                 console.log(`✅ ${api.name} success`);
//                 break;
//               } else if (data.response) {
//                 deepseekResponse = data.response;
//                 apiUsed = `${api.name} (DeepSeek alternative)`;
//                 fallbackUsed = true;
//                 console.log(`✅ ${api.name} success`);
//                 break;
//               }
//             }
//           } catch (altError) {
//             console.log(`❌ ${api.name} failed: ${altError.message}`);
//             continue;
//           }
//         }
        
//         // If all APIs failed, use intelligent fallback
//         if (!deepseekResponse) {
//           console.log(`🔄 [DEEPSEEK] All APIs failed, using intelligent fallback`);
//           deepseekResponse = generateIntelligentFallback(query);
//           apiUsed = 'Intelligent Fallback Generator';
//           fallbackUsed = true;
//         }
//       }

//       // Update status
//       await sock.sendMessage(jid, {
//         text: `🤖 *DEEPSEEK AI*\n` +
//               `⚡ *Processing...* ✅\n` +
//               `💭 *Formatting response...*\n` +
//               `⚡ *Finalizing output...*`,
//         edit: statusMsg.key
//       });

//       // Clean and format response
//       deepseekResponse = deepseekResponse.trim();
//       console.log(`📝 [DEEPSEEK] Response length: ${deepseekResponse.length} characters`);
      
//       // Check for error indicators
//       const lowerResponse = deepseekResponse.toLowerCase();
//       if (!fallbackUsed && (lowerResponse.includes('error:') || 
//           lowerResponse.startsWith('error') ||
//           lowerResponse.includes('failed to') ||
//           lowerResponse.includes('unavailable') ||
//           lowerResponse.includes('not found'))) {
//         console.log('❌ Response contains error indicator');
//         throw new Error(deepseekResponse);
//       }
      
//       // Check if it's a coding/math query for special formatting
//       const isCodingQuery = isCodeRelated(query);
//       const isMathQuery = isMathRelated(query);
      
//       // Format response for WhatsApp
//       deepseekResponse = formatDeepSeekResponse(deepseekResponse, isCodingQuery, isMathQuery);
      
//       // Truncate if too long for WhatsApp
//       if (deepseekResponse.length > 2200) {
//         deepseekResponse = deepseekResponse.substring(0, 2200) + '\n\n... (response truncated)';
//       }

//       // Format final message
//       let resultText = `🤖 *DEEPSEEK AI*\n\n`;
      
//       // Add status note if fallback used
//       if (fallbackUsed) {
//         resultText += `⚠️ *Note:* Using ${apiUsed} (DeepSeek busy)\n\n`;
//       }
      
//       // Add expertise badge
//       if (isCodingQuery) {
//         resultText += `💻 *Specialty: Coding & Programming*\n\n`;
//       } else if (isMathQuery) {
//         resultText += `🧮 *Specialty: Mathematics & Logic*\n\n`;
//       }
      
//       // Query display
//       const displayQuery = query.length > 80 ? query.substring(0, 80) + '...' : query;
//       resultText += `💭 *Query:* ${displayQuery}\n\n`;
      
//       // DeepSeek Response
//       resultText += `🤖 *Response:*\n${deepseekResponse}\n\n`;
      
//       // Footer with source info
//       resultText += `🔧 *Source:* ${apiUsed}\n`;
//       if (fallbackUsed) {
//         resultText += `📢 *DeepSeek API is currently busy*\n`;
//         resultText += `🔄 *Using alternative AI service*`;
//       } else {
//         resultText += `⚡ *Powered by DeepSeek AI*\n`;
//         resultText += `🚀 *Strong in reasoning, coding, and mathematics*`;
//       }

//       // Send final answer
//       console.log('📤 Sending response to WhatsApp');
//       await sock.sendMessage(jid, {
//         text: resultText,
//         edit: statusMsg.key
//       });

//       console.log(`✅ Response sent via ${apiUsed}`);

//     } catch (error) {
//       console.error('❌ [DEEPSEEK] FINAL ERROR:', error.message);
      
//       // Simplified error message
//       let errorMessage = `❌ *DEEPSEEK AI ERROR*\n\n`;
      
//       if (error.message.includes('busy') || error.message.includes('Server is busy')) {
//         errorMessage += `• DeepSeek servers are currently busy\n`;
//         errorMessage += `• High traffic on the API\n`;
//         errorMessage += `• Please try again in a few minutes\n`;
//       } else if (error.message.includes('timeout')) {
//         errorMessage += `• Request timed out\n`;
//         errorMessage += `• DeepSeek is processing\n`;
//         errorMessage += `• Try simpler query\n`;
//       } else if (error.message.includes('network') || error.message.includes('connect')) {
//         errorMessage += `• Network connection issue\n`;
//         errorMessage += `• Check your internet\n`;
//       } else {
//         errorMessage += `• Error: ${error.message}\n`;
//       }
      
//       errorMessage += `\n🔄 *Quick Alternatives:*\n`;
//       errorMessage += `1. Try \`${PREFIX}gpt\` - ChatGPT\n`;
//       errorMessage += `2. Try \`${PREFIX}claudeai\` - Claude AI\n`;
//       errorMessage += `3. Try \`${PREFIX}bard\` - Google Bard\n`;
//       errorMessage += `4. Wait 2 minutes then retry\n`;
      
//       errorMessage += `\n⚡ *Tip:* DeepSeek is popular for coding/math queries`;

//       // Send error message
//       try {
//         await sock.sendMessage(jid, {
//           text: errorMessage
//         }, { quoted: m });
//       } catch (sendError) {
//         console.error('❌ Failed to send error:', sendError);
//       }
//     }
//   }
// };

// // Generate intelligent fallback responses
// function generateIntelligentFallback(query) {
//   const lowerQuery = query.toLowerCase();
  
//   // Greetings
//   if (lowerQuery.includes('hello') || lowerQuery.includes('hi') || lowerQuery.includes('hey')) {
//     return "Hello! I'm an AI assistant (currently using fallback mode as DeepSeek is busy). How can I help you today?";
//   }
  
//   // Coding questions
//   if (isCodeRelated(lowerQuery)) {
//     const codingResponses = [
//       "I can help with coding questions! DeepSeek is known for excellent programming assistance. Please try the GPT or Claude commands for immediate coding help.",
//       "For coding queries, DeepSeek provides great explanations. While it's busy, you might want to try the GPT command for programming assistance.",
//       "DeepSeek excels at coding problems. You could rephrase your question or try another AI command for technical help."
//     ];
//     return codingResponses[Math.floor(Math.random() * codingResponses.length)];
//   }
  
//   // Math questions
//   if (isMathRelated(lowerQuery)) {
//     const mathResponses = [
//       "DeepSeek is strong in mathematics. For math problems, you might want to try the GPT command as an alternative while DeepSeek is busy.",
//       "Mathematical reasoning is a DeepSeek specialty. Consider trying another AI or waiting a few minutes before retrying.",
//       "For math queries, DeepSeek provides detailed step-by-step solutions. You could try rephrasing or using a different AI command."
//     ];
//     return mathResponses[Math.floor(Math.random() * mathResponses.length)];
//   }
  
//   // General fallback
//   const generalResponses = [
//     "I understand your query. DeepSeek AI is currently experiencing high demand. You might want to try another AI command or wait a few minutes.",
//     "Thanks for your question! DeepSeek servers are busy at the moment. Consider using GPT or Claude AI for immediate assistance.",
//     "Your query has been received. Due to high traffic on DeepSeek, you could try rephrasing or using a different AI service available."
//   ];
  
//   return generalResponses[Math.floor(Math.random() * generalResponses.length)];
// }

// // Helper functions (keep the same as before)

// function extractDeepSeekResponse(obj, depth = 0) {
//   if (depth > 3) return 'Response too complex';
//   if (typeof obj === 'string') return obj;
//   if (Array.isArray(obj)) {
//     return obj.map(item => extractDeepSeekResponse(item, depth + 1))
//               .filter(text => text && text.trim())
//               .join('\n');
//   }
//   if (obj && typeof obj === 'object') {
//     const priorityFields = ['result', 'response', 'answer', 'text', 'content', 'message'];
//     for (const field of priorityFields) {
//       if (obj[field]) {
//         const extracted = extractDeepSeekResponse(obj[field], depth + 1);
//         if (extracted && extracted.trim()) return extracted;
//       }
//     }
//     for (const key in obj) {
//       if (typeof obj[key] === 'string' && obj[key].trim()) return obj[key];
//     }
//   }
//   return 'Response received';
// }

// function isCodeRelated(query) {
//   const lowerQuery = query.toLowerCase();
//   const codeKeywords = ['code', 'program', 'function', 'python', 'javascript', 'java', 'html', 'css', 'algorithm'];
//   return codeKeywords.some(keyword => lowerQuery.includes(keyword));
// }

// function isMathRelated(query) {
//   const lowerQuery = query.toLowerCase();
//   const mathKeywords = ['math', 'calculate', 'equation', 'algebra', 'geometry', 'solve', 'derivative', 'integral'];
//   return mathKeywords.some(keyword => lowerQuery.includes(keyword));
// }

// function formatDeepSeekResponse(text, isCodingQuery, isMathQuery) {
//   if (!text) return 'Response not available';
//   text = text.trim();
  
//   // Clean response
//   text = text.replace(/\[\d+\]/g, '');
//   text = text.replace(/\*\*(.*?)\*\*/g, '*$1*');
//   text = text.replace(/\s+/g, ' ');
//   text = text.replace(/\n\s+/g, '\n');
  
//   return text;
// }
import axios from "axios";

export default {
  name: "venice",
  category: "AI",
  aliases: ["veniceai", "vai", "ven"],
  description: "Query Venice AI via Keith's API",
  
  async execute(sock, m, args, PREFIX) {
    const jid = m.key.remoteJid;
    const quoted = m.quoted;
    let query = "";

    // Get query from arguments or quoted message
    if (args.length > 0) {
      query = args.join(" ");
    } else if (quoted && quoted.text) {
      query = quoted.text;
    } else {
      await sock.sendMessage(jid, { 
        text: `🎭 *Venice AI*\n\n` +
              `💡 *Usage:*\n` +
              `• \`${PREFIX}venice your question\`\n` +
              `• \`${PREFIX}venice explain something\`\n` +
              `• Reply to a message with \`${PREFIX}venice\`\n\n` +
              `📌 *Examples:*\n` +
              `• \`${PREFIX}venice What is creative writing?\`\n` +
              `• \`${PREFIX}veniceai Generate a story idea\`\n` +
              `• \`${PREFIX}vai Help me brainstorm\`\n` +
              `• Reply to a text with \`${PREFIX}venice\`\n\n` +
              `🔤 *Aliases:* ${PREFIX}veniceai, ${PREFIX}vai, ${PREFIX}ven\n\n` +
              `🎨 *Features:* Strong in creativity, storytelling, and brainstorming`
      }, { quoted: m });
      return;
    }

    console.log(`🎭 [VENICE] Query: "${query}"`);

    try {
      // Send initial status
      const statusMsg = await sock.sendMessage(jid, { 
        text: `🎭 *VENICE AI*\n` +
              `⚡ *Connecting to Venice AI...*\n` +
              `💭 "${query.substring(0, 50)}${query.length > 50 ? '...' : ''}"`
      }, { quoted: m });

      let veniceResponse = '';
      let apiUsed = '';
      let fallbackUsed = false;
      
      // Try primary Keith API
      try {
        const apiUrl = `https://apiskeith.vercel.app/ai/venice?q=${encodeURIComponent(query)}`;
        console.log(`🌐 [VENICE] Trying primary API: ${apiUrl}`);
        
        const response = await axios({
          method: 'GET',
          url: apiUrl,
          timeout: 30000,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Accept': 'application/json'
          }
        });

        console.log(`✅ [VENICE] Primary API response status: ${response.status}`);
        
        if (response.data && typeof response.data === 'object') {
          const data = response.data;
          
          console.log('📊 Venice API Response keys:', Object.keys(data));
          
          // Check for error
          if (data.error) {
            console.log('❌ API returned error:', data.error);
            throw new Error(data.error);
          }
          
          if (data.status === true && data.result) {
            veniceResponse = data.result;
            apiUsed = 'Keith Venice API';
            console.log('✅ Using data.result');
          } else if (data.response) {
            veniceResponse = data.response;
            apiUsed = 'Keith Venice API';
            console.log('✅ Using data.response');
          } else if (data.answer) {
            veniceResponse = data.answer;
            apiUsed = 'Keith Venice API';
            console.log('✅ Using data.answer');
          } else {
            throw new Error('Invalid response format from Venice API');
          }
        } else {
          throw new Error('Invalid response from Venice API');
        }
        
      } catch (primaryError) {
        console.log(`⚠️ [VENICE] Primary API failed: ${primaryError.message}`);
        
        // Try alternative creative AI APIs
        const alternativeAPIs = [
          {
            name: 'Creative GPT API',
            url: `https://apiskeith.vercel.app/ai/gpt?q=${encodeURIComponent("creative response to: " + query)}`
          },
          {
            name: 'Claude Creative API',
            url: `https://apiskeith.vercel.app/ai/claudeai?q=${encodeURIComponent("creative: " + query)}`
          },
          {
            name: 'General Creative AI',
            url: `https://api.beautyofweb.com/gpt4?q=${encodeURIComponent("be creative: " + query)}`
          }
        ];
        
        for (const api of alternativeAPIs) {
          try {
            console.log(`🔄 [VENICE] Trying alternative: ${api.name}`);
            
            const altResponse = await axios({
              method: 'GET',
              url: api.url,
              timeout: 25000,
              headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Accept': 'application/json'
              }
            });
            
            if (altResponse.data && typeof altResponse.data === 'object') {
              const data = altResponse.data;
              
              if (data.status === true && data.result) {
                veniceResponse = data.result;
                apiUsed = `${api.name} (Venice alternative)`;
                fallbackUsed = true;
                console.log(`✅ ${api.name} success`);
                break;
              } else if (data.response) {
                veniceResponse = data.response;
                apiUsed = `${api.name} (Venice alternative)`;
                fallbackUsed = true;
                console.log(`✅ ${api.name} success`);
                break;
              }
            }
          } catch (altError) {
            console.log(`❌ ${api.name} failed: ${altError.message}`);
            continue;
          }
        }
        
        // If all APIs failed, use creative fallback
        if (!veniceResponse) {
          console.log(`🔄 [VENICE] All APIs failed, using creative fallback`);
          veniceResponse = generateCreativeFallback(query);
          apiUsed = 'Creative Fallback Generator';
          fallbackUsed = true;
        }
      }

      // Update status
      await sock.sendMessage(jid, {
        text: `🎭 *VENICE AI*\n` +
              `⚡ *Processing...* ✅\n` +
              `💭 *Thinking creatively...*\n` +
              `🎨 *Generating imaginative response...*`,
        edit: statusMsg.key
      });

      // Clean and format response
      veniceResponse = veniceResponse.trim();
      console.log(`📝 [VENICE] Response length: ${veniceResponse.length} characters`);
      
      // Check if response is empty
      if (!veniceResponse || veniceResponse.trim() === '') {
        console.log('❌ Empty response');
        throw new Error('No response generated');
      }
      
      // Check for error indicators
      const lowerResponse = veniceResponse.toLowerCase();
      if (!fallbackUsed && (lowerResponse.includes('error:') || 
          lowerResponse.startsWith('error') ||
          lowerResponse.includes('failed to') ||
          lowerResponse.includes('unavailable'))) {
        console.log('❌ Response contains error indicator');
        throw new Error(veniceResponse);
      }
      
      // Check if it's a creative query for special formatting
      const isCreativeQuery = isCreativeRelated(query);
      const isStoryQuery = isStoryRelated(query);
      
      // Format response for WhatsApp
      veniceResponse = formatVeniceResponse(veniceResponse, isCreativeQuery, isStoryQuery);
      
      // Truncate if too long for WhatsApp
      if (veniceResponse.length > 2300) {
        veniceResponse = veniceResponse.substring(0, 2300) + '\n\n... (response truncated)';
      }

      // Format final message
      let resultText = `🎭 *VENICE AI*\n\n`;
      
      // Add creative badge
      if (isCreativeQuery) {
        resultText += `🎨 *Specialty: Creative & Imaginative*\n\n`;
      } else if (isStoryQuery) {
        resultText += `📖 *Specialty: Storytelling & Narratives*\n\n`;
      }
      
      // Add status note if fallback used
      if (fallbackUsed && apiUsed.includes('alternative')) {
        resultText += `🔄 *Note:* Using ${apiUsed}\n\n`;
      }
      
      // Query display
      const displayQuery = query.length > 80 ? query.substring(0, 80) + '...' : query;
      resultText += `💭 *Query:* ${displayQuery}\n\n`;
      
      // Venice Response
      resultText += `🎭 *Venice's Response:*\n${veniceResponse}\n\n`;
      
      // Footer with source info
      if (fallbackUsed) {
        resultText += `🔧 *Source:* ${apiUsed}\n`;
        if (apiUsed.includes('Fallback')) {
          resultText += `📢 *Venice API is currently unavailable*\n`;
          resultText += `🔄 *Using creative fallback response*`;
        } else {
          resultText += `🔄 *Venice AI busy, using alternative creative AI*`;
        }
      } else {
        resultText += `⚡ *Powered by Venice AI*\n`;
        resultText += `🎨 *Specialized in creativity and imagination*`;
      }

      // Send final answer
      console.log('📤 Sending Venice AI response to WhatsApp');
      await sock.sendMessage(jid, {
        text: resultText,
        edit: statusMsg.key
      });

      console.log(`✅ Venice response sent via ${apiUsed}`);

    } catch (error) {
      console.error('❌ [VENICE] FINAL ERROR:', error.message);
      
      // Simplified error message
      let errorMessage = `❌ *VENICE AI ERROR*\n\n`;
      
      if (error.message.includes('timeout')) {
        errorMessage += `• Request timed out (30s)\n`;
        errorMessage += `• Venice AI is thinking creatively\n`;
        errorMessage += `• Try simpler query\n`;
      } else if (error.message.includes('network') || error.message.includes('connect')) {
        errorMessage += `• Network connection issue\n`;
        errorMessage += `• Check your internet\n`;
      } else if (error.message.includes('busy') || error.message.includes('unavailable')) {
        errorMessage += `• Venice AI servers are busy\n`;
        errorMessage += `• High demand for creative AI\n`;
        errorMessage += `• Please try again in a few minutes\n`;
      } else if (error.message.includes('No response')) {
        errorMessage += `• No response generated\n`;
        errorMessage += `• Try rephrasing your query\n`;
        errorMessage += `• Be more specific\n`;
      } else {
        errorMessage += `• Error: ${error.message}\n`;
      }
      
      errorMessage += `\n🔄 *Creative Alternatives:*\n`;
      errorMessage += `1. Try \`${PREFIX}gpt\` for general AI\n`;
      errorMessage += `2. Try \`${PREFIX}bard\` for Google's creative AI\n`;
      errorMessage += `3. Try \`${PREFIX}claudeai\` for thoughtful responses\n`;
      errorMessage += `4. Wait 2 minutes then retry\n`;
      
      errorMessage += `\n🎨 *Tip:* Venice AI excels at creative writing and brainstorming`;

      // Send error message
      try {
        await sock.sendMessage(jid, {
          text: errorMessage
        }, { quoted: m });
      } catch (sendError) {
        console.error('❌ Failed to send error:', sendError);
      }
    }
  }
};

// Generate creative fallback responses
function generateCreativeFallback(query) {
  const lowerQuery = query.toLowerCase();
  
  // Creative writing prompts
  if (isCreativeRelated(lowerQuery)) {
    const creativeResponses = [
      "Here's a creative idea for you: Imagine a world where " + 
      (lowerQuery.includes('story') ? "every story has two endings, and readers choose which one becomes real." : 
       lowerQuery.includes('character') ? "characters from different books can meet and interact." :
       "creative ideas manifest as colorful, floating orbs that people collect and trade."),
      
      "For creative inspiration: Think about " +
      (lowerQuery.includes('write') ? "writing from the perspective of an inanimate object witnessing human drama." :
       lowerQuery.includes('art') ? "combining two unrelated art styles to create something completely new." :
       "the most unexpected combination of elements you can imagine."),
      
      "Creative approach: Consider " +
      (lowerQuery.includes('brainstorm') ? "listing 20 completely absurd ideas first, then finding the gems among them." :
       lowerQuery.includes('design') ? "designing something that serves the opposite purpose of what it appears to be." :
       "looking at your topic from the perspective of someone from a different century.")
    ];
    return creativeResponses[Math.floor(Math.random() * creativeResponses.length)];
  }
  
  // Story prompts
  if (isStoryRelated(lowerQuery)) {
    const storyResponses = [
      "Story idea: A librarian discovers that certain books in their collection are actually portals to the worlds described within them.",
      "Narrative prompt: Write about a character who can hear people's thoughts, but only when they're lying to themselves.",
      "Plot concept: In a world where memories can be bought and sold, someone discovers they've been purchasing someone else's past."
    ];
    return storyResponses[Math.floor(Math.random() * storyResponses.length)];
  }
  
  // General creative fallback
  const generalResponses = [
    "Venice AI specializes in creative thinking. Your query opens interesting possibilities for imaginative exploration. Consider looking at it from an unconventional angle.",
    "Creative perspective: Every question contains the seeds of multiple creative answers. What if you approached this from a completely different direction?",
    "Imagination often works best when given constraints. Try limiting your approach in some way, then see what creative solutions emerge."
  ];
  
  return generalResponses[Math.floor(Math.random() * generalResponses.length)];
}

// Check if query is creative-related
function isCreativeRelated(query) {
  const lowerQuery = query.toLowerCase();
  const creativeKeywords = [
    'creative', 'imagine', 'imagination', 'brainstorm', 'idea', 'ideas',
    'innovate', 'innovation', 'design', 'art', 'artist', 'painting',
    'draw', 'sketch', 'invent', 'invention', 'original', 'unique',
    'inspire', 'inspiration', 'creative writing', 'poem', 'poetry'
  ];
  
  return creativeKeywords.some(keyword => lowerQuery.includes(keyword));
}

// Check if query is story-related
function isStoryRelated(query) {
  const lowerQuery = query.toLowerCase();
  const storyKeywords = [
    'story', 'stories', 'narrative', 'plot', 'character', 'characters',
    'fiction', 'novel', 'book', 'write', 'writing', 'author',
    'tale', 'fable', 'myth', 'legend', 'scene', 'dialogue',
    'setting', 'theme', 'conflict', 'resolution', 'protagonist'
  ];
  
  return storyKeywords.some(keyword => lowerQuery.includes(keyword));
}

// Format Venice response
function formatVeniceResponse(text, isCreativeQuery, isStoryQuery) {
  if (!text) return 'Creative response not available';
  
  // Clean response
  text = text.trim();
  
  // Add creative formatting for stories
  if (isStoryQuery && !text.includes('📖') && !text.includes('✨')) {
    const storyIntros = ['📖 Story Idea:', '✨ Creative Prompt:', '🎭 Narrative Concept:'];
    const randomIntro = storyIntros[Math.floor(Math.random() * storyIntros.length)];
    if (!text.startsWith(storyIntros[0].substring(0, 5))) {
      text = randomIntro + ' ' + text;
    }
  }
  
  // Add creative formatting for general creative queries
  if (isCreativeQuery && !text.includes('🎨') && !text.includes('💡')) {
    const creativeIntros = ['🎨 Creative Perspective:', '💡 Imaginative Idea:', '🌟 Creative Insight:'];
    const randomIntro = creativeIntros[Math.floor(Math.random() * creativeIntros.length)];
    if (!text.startsWith(creativeIntros[0].substring(0, 5))) {
      text = randomIntro + ' ' + text;
    }
  }
  
  // Clean markdown
  text = text.replace(/\[\d+\]/g, '');
  text = text.replace(/\*\*(.*?)\*\*/g, '*$1*');
  text = text.replace(/\s+/g, ' ');
  text = text.replace(/\n\s+/g, '\n');
  
  return text;
}
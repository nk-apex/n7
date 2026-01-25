// import axios from 'axios';
// import FormData from 'form-data';
// import { downloadContentFromMessage } from '@whiskeysockets/baileys';

// export default {
//   name: 'vision',
//   description: 'AI-powered image analysis',
//   category: 'ai',
//   aliases: ['analyze', 'imgai', 'describe', 'whatisthis'],
//   usage: 'vision [prompt] or reply to image',
  
//   async execute(sock, m, args, PREFIX, extra) {
//     const jid = m.key.remoteJid;
    
//     // ====== DETECT IF USER IS REPLYING TO AN IMAGE ======
//     let isReplyingToImage = false;
    
//     // Check if message is a reply
//     if (m.message?.extendedTextMessage?.contextInfo?.quotedMessage) {
//       const quoted = m.message.extendedTextMessage.contextInfo.quotedMessage;
      
//       // Check if quoted message contains an image
//       if (quoted.imageMessage) {
//         isReplyingToImage = true;
//       } else if (quoted.documentMessage?.mimetype?.startsWith('image/')) {
//         isReplyingToImage = true;
//       }
//     }
    
//     // Check if message itself contains an image (with caption .vision)
//     if (m.message?.imageMessage) {
//       isReplyingToImage = true;
//     } else if (m.message?.documentMessage?.mimetype?.startsWith('image/')) {
//       isReplyingToImage = true;
//     }
    
//     // Check if URL is provided as argument
//     const hasUrl = args[0] && args[0].startsWith('http');
    
//     // ====== SHOW HELP ONLY IF NO IMAGE SOURCE ======
//     if (!isReplyingToImage && !hasUrl && args[0] !== 'help') {
//       const helpText = `👁️ *WOLFBOT VISION*\n\n` +
//         `💡 *Usage:*\n` +
//         `• \`${PREFIX}vision\` (reply to image)\n` +
//         `• \`${PREFIX}vision what is this?\` (with prompt)\n` +
//         `• Send image with caption \`${PREFIX}vision\`\n\n` +
        
//         `✨ *Features:*\n` +
//         `• AI image analysis\n` +
//         `• Object identification\n` +
//         `• Scene description\n` +
//         `• Text extraction\n` +
//         `• Answer questions about images\n\n` +
        
//         `🎯 *Examples:*\n` +
//         `\`${PREFIX}vision\` (reply to image)\n` +
//         `\`${PREFIX}vision what animals are in this picture?\`\n` +
//         `\`${PREFIX}analyze describe this scene\`\n` +
//         `\`${PREFIX}whatisthis\` (simple analysis)`;
      
//       return sock.sendMessage(jid, { text: helpText }, { quoted: m });
//     }

//     // ====== SHOW HELP IF EXPLICITLY REQUESTED ======
//     if (args[0] === 'help') {
//       const helpText = `👁️ *WOLFBOT VISION*\n\n` +
//         `💡 *Usage:*\n` +
//         `• \`${PREFIX}vision\` (reply to image)\n` +
//         `• \`${PREFIX}vision what is this?\` (with prompt)\n` +
//         `• Send image with caption \`${PREFIX}vision\`\n\n` +
        
//         `✨ *Features:*\n` +
//         `• AI image analysis\n` +
//         `• Object identification\n` +
//         `• Scene description\n` +
//         `• Text extraction\n` +
//         `• Answer questions about images\n\n` +
        
//         `🎯 *Examples:*\n` +
//         `\`${PREFIX}vision\` (reply to image)\n` +
//         `\`${PREFIX}vision what animals are in this picture?\`\n` +
//         `\`${PREFIX}analyze describe this scene\`\n` +
//         `\`${PREFIX}whatisthis\` (simple analysis)`;
      
//       return sock.sendMessage(jid, { text: helpText }, { quoted: m });
//     }

//     try {
//       // ====== DETECT IMAGE SOURCE ======
//       let imageBuffer = null;
//       let imageSource = '';
      
//       // Method 1: Check if URL provided
//       if (args[0] && args[0].startsWith('http')) {
//         const imageUrl = args[0];
//         console.log(`👁️ Downloading image from URL: ${imageUrl}`);
        
//         const response = await axios.get(imageUrl, {
//           responseType: 'arraybuffer',
//           timeout: 15000,
//           headers: {
//             'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
//           }
//         });
        
//         imageBuffer = Buffer.from(response.data);
//         imageSource = 'url';
        
//       } 
//       // Method 2: Check if replying to message with image
//       else if (m.message?.extendedTextMessage?.contextInfo?.quotedMessage) {
//         const quoted = m.message.extendedTextMessage.contextInfo.quotedMessage;
        
//         if (quoted.imageMessage) {
//           console.log('👁️ Downloading quoted image message');
//           const stream = await downloadContentFromMessage(quoted.imageMessage, 'image');
//           imageBuffer = await streamToBuffer(stream);
//           imageSource = 'quoted_image';
//         } 
//         else if (quoted.documentMessage?.mimetype?.startsWith('image/')) {
//           console.log('👁️ Downloading quoted document image');
//           const stream = await downloadContentFromMessage(quoted.documentMessage, 'document');
//           imageBuffer = await streamToBuffer(stream);
//           imageSource = 'quoted_document';
//         }
//         else {
//           throw new Error('Quoted message does not contain an image');
//         }
//       }
//       // Method 3: Check if message itself contains image
//       else if (m.message?.imageMessage) {
//         console.log('👁️ Downloading image from message');
//         const stream = await downloadContentFromMessage(m.message.imageMessage, 'image');
//         imageBuffer = await streamToBuffer(stream);
//         imageSource = 'direct_image';
//       }
//       // Method 4: Check if message contains image document
//       else if (m.message?.documentMessage?.mimetype?.startsWith('image/')) {
//         console.log('👁️ Downloading image document');
//         const stream = await downloadContentFromMessage(m.message.documentMessage, 'document');
//         imageBuffer = await streamToBuffer(stream);
//         imageSource = 'direct_document';
//       }
      
//       // If no image found (should not happen with our check above)
//       if (!imageBuffer) {
//         return sock.sendMessage(jid, {
//           text: `❌ *NO IMAGE FOUND!*\n\n💡 *How to use:*\n1. Reply to an image with \`${PREFIX}vision\`\n2. Send image with caption \`${PREFIX}vision\`\n3. Use URL: \`${PREFIX}vision https://image.com/photo.jpg\``
//         }, { quoted: m });
//       }
      
//       // ====== EXTRACT PROMPT ======
//       // Remove URL if present
//       let promptArgs = args;
//       if (args[0] && args[0].startsWith('http')) {
//         promptArgs = args.slice(1);
//       }
      
//       let prompt = promptArgs.join(' ').trim();
//       if (!prompt) {
//         prompt = "What is this image about?";
//       }
      
//       console.log(`👁️ Vision analysis with prompt: "${prompt}"`);
      
//       // ====== VALIDATE IMAGE ======
//       const imageSizeMB = (imageBuffer.length / 1024 / 1024).toFixed(2);
//       console.log(`📊 Image size: ${imageSizeMB}MB`);
      
//       if (imageBuffer.length > 10 * 1024 * 1024) {
//         return sock.sendMessage(jid, {
//           text: `❌ *IMAGE TOO LARGE!*\n\nSize: ${imageSizeMB}MB\nMax: 10MB\n\n💡 Compress image first or use smaller file.`
//         }, { quoted: m });
//       }
      
//       if (imageBuffer.length < 1024) {
//         return sock.sendMessage(jid, {
//           text: `❌ *IMAGE TOO SMALL!*\n\nImage appears corrupted or invalid.\n\n💡 Try different image.`
//         }, { quoted: m });
//       }
      
//       // ====== PROCESSING MESSAGE ======
//       const statusMsg = await sock.sendMessage(jid, {
//         text: `👁️ *VISION ANALYSIS*\n\n` +
//               `📸 *Processing image...*\n` +
//               `📊 Size: ${imageSizeMB}MB\n` +
//               `💭 Prompt: "${prompt.substring(0, 50)}${prompt.length > 50 ? '...' : ''}"\n\n` +
//               `⏳ *Uploading to server...*`
//       }, { quoted: m });
      
//       // ====== UPLOAD TO CATBOX ======
//       await sock.sendMessage(jid, {
//         text: `👁️ *VISION ANALYSIS*\n\n` +
//               `📸 *Processing...* ✅\n` +
//               `📊 Size: ${imageSizeMB}MB\n` +
//               `💭 Prompt: "${prompt.substring(0, 50)}${prompt.length > 50 ? '...' : ''}"\n\n` +
//               `⏳ *Uploading to server...* 🔄`,
//         edit: statusMsg.key
//       });
      
//       let uploadedUrl = '';
//       try {
//         uploadedUrl = await uploadToCatbox(imageBuffer);
//         console.log(`✅ Uploaded to Catbox: ${uploadedUrl}`);
//       } catch (uploadError) {
//         console.error('Catbox upload failed:', uploadError);
        
//         await sock.sendMessage(jid, {
//           text: `👁️ *VISION ANALYSIS*\n\n` +
//                 `📸 *Processing...* ✅\n` +
//                 `📊 Size: ${imageSizeMB}MB\n` +
//                 `💭 Prompt: "${prompt.substring(0, 50)}${prompt.length > 50 ? '...' : ''}"\n\n` +
//                 `⏳ *Upload failed, trying direct method...*`,
//           edit: statusMsg.key
//         });
        
//         throw new Error('Image upload service unavailable');
//       }
      
//       // ====== ANALYZE WITH GPT-NANO API ======
//       await sock.sendMessage(jid, {
//         text: `👁️ *VISION ANALYSIS*\n\n` +
//               `📸 *Processing...* ✅\n` +
//               `📊 Size: ${imageSizeMB}MB\n` +
//               `💭 Prompt: "${prompt.substring(0, 50)}${prompt.length > 50 ? '...' : ''}"\n\n` +
//               `⏳ *Uploading...* ✅\n` +
//               `🤖 *Analyzing with AI...*`,
//         edit: statusMsg.key
//       });
      
//       const encodedPrompt = encodeURIComponent(prompt);
//       const encodedUrl = encodeURIComponent(uploadedUrl);
//       const apiUrl = `https://api.ootaizumi.web.id/ai/gptnano?prompt=${encodedPrompt}&imageUrl=${encodedUrl}`;
      
//       console.log(`🔗 Calling GPT-Nano API: ${apiUrl}`);
      
//       const response = await axios.get(apiUrl, {
//         timeout: 60000,
//         headers: {
//           'User-Agent': 'WolfBot-Vision/1.0',
//           'Accept': 'application/json',
//           'Referer': 'https://wolfbot.com/'
//         }
//       });
      
//       console.log(`✅ GPT-Nano response received`);
      
//       // ====== EXTRACT ANALYSIS RESULT ======
//       let analysisResult = '';
      
//       if (response.data && typeof response.data === 'object') {
//         if (response.data.result) {
//           analysisResult = response.data.result;
//         } else if (response.data.analysis) {
//           analysisResult = response.data.analysis;
//         } else if (response.data.description) {
//           analysisResult = response.data.description;
//         } else if (response.data.text) {
//           analysisResult = response.data.text;
//         } else {
//           analysisResult = JSON.stringify(response.data, null, 2);
//         }
//       } else if (typeof response.data === 'string') {
//         analysisResult = response.data;
//       } else {
//         throw new Error('Invalid API response format');
//       }
      
//       // Clean up the result
//       analysisResult = analysisResult.trim();
      
//       // ====== SEND ANALYSIS RESULT ======
//       await sock.sendMessage(jid, {
//         text: `👁️ *VISION ANALYSIS*\n\n` +
//               `📸 *Processing...* ✅\n` +
//               `📊 Size: ${imageSizeMB}MB\n` +
//               `💭 Prompt: "${prompt.substring(0, 50)}${prompt.length > 50 ? '...' : ''}"\n\n` +
//               `⏳ *Uploading...* ✅\n` +
//               `🤖 *Analyzing with AI...* ✅\n` +
//               `📤 *Sending results...*`,
//         edit: statusMsg.key
//       });
      
//       // Create final analysis message
//       let resultText = `👁️ *VISION ANALYSIS*\n\n`;
      
//       resultText += `💭 *Your Question:*\n"${prompt}"\n\n`;
//       resultText += `📋 *Analysis Results:*\n${analysisResult}\n\n`;
//       resultText += `📊 *Image Info:*\n`;
//       resultText += `• Size: ${imageSizeMB}MB\n`;
//       resultText += `• Source: ${imageSource.replace(/_/g, ' ')}\n`;
//       resultText += `• Model: GPT-Nano Vision\n\n`;
//       resultText += `✨ *Powered by WolfBot Vision*`;
      
//       // Send final result
//       await sock.sendMessage(jid, {
//         text: resultText,
//         edit: statusMsg.key
//       });
      
//     } catch (error) {
//       console.error('❌ [VISION] ERROR:', error);
      
//       let errorMessage = `❌ *VISION ANALYSIS FAILED!*\n\n`;
      
//       if (error.message.includes('timeout')) {
//         errorMessage += `• Analysis timeout (60s)\n`;
//         errorMessage += `• Image might be too complex\n`;
//         errorMessage += `• Try simpler prompt\n`;
//       } else if (error.message.includes('upload')) {
//         errorMessage += `• Image upload failed\n`;
//         errorMessage += `• Try different image\n`;
//       } else if (error.message.includes('Quoted message')) {
//         errorMessage += `• The message you replied to doesn't contain an image\n`;
//         errorMessage += `• Reply to an actual image\n`;
//       } else if (error.response?.status === 429) {
//         errorMessage += `• Too many requests\n`;
//         errorMessage += `• Wait 1-2 minutes\n`;
//       } else if (error.response?.status === 400) {
//         errorMessage += `• Invalid image or prompt\n`;
//       } else {
//         errorMessage += `• Error: ${error.message}\n`;
//       }
      
//       errorMessage += `\n💡 *Try these examples:*\n`;
//       errorMessage += `\`${PREFIX}vision describe this image\`\n`;
//       errorMessage += `\`${PREFIX}analyze what is this?\`\n`;
//       errorMessage += `\`${PREFIX}whatisthis\`\n\n`;
//       errorMessage += `🔧 *Help:* \`${PREFIX}vision help\``;
      
//       await sock.sendMessage(jid, {
//         text: errorMessage
//       }, { quoted: m });
//     }
//   },
// };

// // ====== HELPER FUNCTIONS ======

// // Upload to Catbox.moe (same as remini command)
// async function uploadToCatbox(buffer) {
//   console.log('📤 Uploading to Catbox...');
  
//   const form = new FormData();
//   form.append('reqtype', 'fileupload');
//   form.append('fileToUpload', buffer, {
//     filename: `image_${Date.now()}.jpg`,
//     contentType: 'image/jpeg'
//   });
  
//   const response = await axios.post('https://catbox.moe/user/api.php', form, {
//     headers: {
//       ...form.getHeaders(),
//       'User-Agent': 'WolfBot/1.0'
//     },
//     timeout: 30000,
//     maxContentLength: 50 * 1024 * 1024,
//   });
  
//   const result = response.data;
  
//   if (!result || !result.includes('http')) {
//     throw new Error('Catbox upload failed: ' + (result || 'No URL returned'));
//   }
  
//   const url = result.trim();
//   console.log(`✅ Catbox URL: ${url}`);
//   return url;
// }

// // Convert stream to buffer
// async function streamToBuffer(stream) {
//   const chunks = [];
//   for await (const chunk of stream) {
//     chunks.push(chunk);
//   }
//   return Buffer.concat(chunks);
// }

















import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { downloadMediaMessage } from '@whiskeysockets/baileys';

export default {
  name: 'vision',
  description: 'Google Gemini Vision AI - Analyze images with Google AI',
  category: 'ai',
  aliases: ['imgai', 'analyze', 'geminivision', 'imganalyze', 'imageai', 'gvision', 'geminiai', 'visual'],
  usage: 'vision [question] - Reply to an image',
  
  async execute(sock, m, args, PREFIX, extra) {
    const jid = m.key.remoteJid;
    const senderJid = m.key.participant || jid;
    
    // ====== HELP SECTION ======
    if (args.length === 0 || args[0].toLowerCase() === 'help') {
      const helpText = `🔍 *GOOGLE GEMINI VISION AI*\n` +
        `👁️ *Image Analysis & Understanding*\n\n` +
        `💡 *Usage:*\n` +
        `• Reply to an image with \`${PREFIX}vision your question\`\n` +
        `• Or just \`${PREFIX}vision\` to analyze image content\n\n` +
        `🌟 *Examples:*\n` +
        `• \`${PREFIX}vision what's in this image?\`\n` +
        `• \`${PREFIX}vision describe this scene\`\n` +
        `• \`${PREFIX}vision read text in image\`\n` +
        `• \`${PREFIX}vision explain this diagram\`\n\n` +
        `📁 *Supported: JPG, PNG, GIF, WebP*\n\n` +
        `⚡ *Powered by Google Gemini AI*`;
      
      return sock.sendMessage(jid, { text: helpText }, { quoted: m });
    }

    // ====== CHECK FOR QUOTED IMAGE ======
    const quotedMsg = m.message?.extendedTextMessage?.contextInfo?.quotedMessage;
    
    if (!quotedMsg) {
      return sock.sendMessage(jid, {
        text: `📌 *REPLY TO AN IMAGE*\n\n` +
              `Please reply to an image message to analyze it.\n\n` +
              `Example: Reply to an image with:\n` +
              `\`${PREFIX}vision what is this?\`\n\n` +
              `Or use \`${PREFIX}vision help\` for more info.`
      }, { quoted: m });
    }

    // Check if quoted message contains an image
    const isImage = 
      quotedMsg.imageMessage ||
      (quotedMsg.documentMessage && 
       quotedMsg.documentMessage.mimetype && 
       quotedMsg.documentMessage.mimetype.startsWith('image/')) ||
      quotedMsg.stickerMessage;

    if (!isImage) {
      return sock.sendMessage(jid, {
        text: `❌ *NOT AN IMAGE*\n\n` +
              `The quoted message must be an image.\n` +
              `Supported formats: JPG, PNG, GIF, WebP\n` +
              `Please reply to an image message.`
      }, { quoted: m });
    }

    // ====== GET QUERY ======
    let query = args.join(' ');
    
    if (!query.trim()) {
      query = 'Analyze this image and describe what you see in detail';
    }

    try {
      // ====== DOWNLOAD IMAGE ======
      console.log('📥 Starting image download...');
      
      const quotedKey = m.message?.extendedTextMessage?.contextInfo?.stanzaId ? {
        remoteJid: jid,
        id: m.message.extendedTextMessage.contextInfo.stanzaId,
        participant: m.message.extendedTextMessage.contextInfo.participant
      } : null;

      if (!quotedKey) {
        throw new Error('Could not identify quoted message for download');
      }

      // Send initial status
      const statusMsg = await sock.sendMessage(jid, {
        text: `🔍 *GOOGLE VISION AI*\n` +
              `📸 *Downloading image...*\n` +
              `⚡ Query: "${query.substring(0, 50)}${query.length > 50 ? '...' : ''}"`
      }, { quoted: m });

      let imageBuffer;
      
      try {
        // Create mock message for download
        const mockMessage = {
          key: quotedKey,
          message: quotedMsg
        };

        imageBuffer = await downloadMediaMessage(
          mockMessage,
          'buffer',
          {},
          {
            logger: { level: 'silent' },
            reuploadRequest: sock.updateMediaMessage
          }
        );
        
        if (!imageBuffer || imageBuffer.length === 0) {
          throw new Error('Empty buffer received');
        }
        
        console.log(`✅ Downloaded ${imageBuffer.length} bytes`);
        
        // Check if it's a valid image
        const magicBytes = imageBuffer.slice(0, 4).toString('hex').toLowerCase();
        const validImageHeaders = ['ffd8ffe0', 'ffd8ffe1', '89504e47', '47494638', '52494646'];
        
        if (!validImageHeaders.some(header => magicBytes.startsWith(header))) {
          console.log(`⚠️ Unusual image header: ${magicBytes}, will try anyway`);
        }
        
      } catch (downloadError) {
        console.error('❌ Download error:', downloadError);
        throw new Error(`Failed to download image. Please try sending the image again.`);
      }

      // ====== UPDATE STATUS ======
      await sock.sendMessage(jid, {
        text: `🔍 *GOOGLE VISION AI*\n` +
              `📸 *Downloading image...* ✅\n` +
              `🤖 *Processing with AI...*\n` +
              `⚡ This may take a moment...`,
        edit: statusMsg.key
      });

      // ====== NEW: DIRECT BASE64 UPLOAD ======
      // Instead of trying to upload to external services, use direct base64
      // but compress and optimize the image first
      
      let finalImageData;
      
      // Check image size and compress if needed
      if (imageBuffer.length > 4 * 1024 * 1024) { // > 4MB
        console.log(`📦 Image too large (${(imageBuffer.length / 1024 / 1024).toFixed(2)}MB), attempting compression...`);
        try {
          // Try to compress using sharp if available
          const sharp = await import('sharp').catch(() => null);
          if (sharp) {
            const compressedBuffer = await sharp.default(imageBuffer)
              .resize(1024, 1024, { fit: 'inside', withoutEnlargement: true })
              .jpeg({ quality: 80 })
              .toBuffer();
            
            if (compressedBuffer.length < imageBuffer.length) {
              imageBuffer = compressedBuffer;
              console.log(`✅ Compressed to ${(imageBuffer.length / 1024 / 1024).toFixed(2)}MB`);
            }
          }
        } catch (compressError) {
          console.log('⚠️ Compression failed, using original:', compressError.message);
        }
      }

      // Convert to base64 for API
      const base64Image = imageBuffer.toString('base64');
      const mimeType = getMimeTypeFromBuffer(imageBuffer) || 'image/jpeg';
      
      // Create data URL
      finalImageData = `data:${mimeType};base64,${base64Image}`;
      
      console.log(`📊 Final image size: ${(base64Image.length / 1024).toFixed(1)}KB as base64`);
      
      // Check if it's too large (some APIs have limits)
      if (finalImageData.length > 10000) { // 10KB limit check
        console.log('⚠️ Image data may be too large for API');
      }

      // ====== CALL VISION API ======
      console.log(`🔍 Sending to Vision API...`);
      console.log(`📝 Query: ${query}`);
      
      // Use a more robust API endpoint that accepts base64
      const apiUrl = 'https://gemini-proxy-production.up.railway.app/gemini-pro-vision';
      // Alternative endpoints if needed:
      // 'https://api-inference.huggingface.co/models/Salesforce/blip-image-captioning-large'
      // 'https://api.ocr.space/parse/image' (for text extraction)

      try {
        const response = await axios({
          method: 'POST',
          url: apiUrl,
          data: {
            image: base64Image, // Send base64 without data URL prefix
            prompt: query,
            mime_type: mimeType
          },
          timeout: 45000, // 45 seconds
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'User-Agent': 'WolfBot-Vision/1.0'
          }
        });

        console.log(`✅ API Response Status: ${response.status}`);

        // ====== PARSE RESPONSE ======
        let visionResponse = '';
        
        if (response.data) {
          const data = response.data;
          console.log('📊 Response structure:', Object.keys(data));
          
          // Try different response formats
          if (data.text || data.response) {
            visionResponse = data.text || data.response;
          } else if (data.choices && data.choices[0] && data.choices[0].message) {
            visionResponse = data.choices[0].message.content;
          } else if (data.candidates && data.candidates[0] && data.candidates[0].content) {
            visionResponse = data.candidates[0].content.parts[0].text;
          } else if (typeof data === 'string') {
            visionResponse = data;
          } else if (data.result) {
            visionResponse = data.result;
          } else if (data.answer) {
            visionResponse = data.answer;
          } else if (data.content) {
            visionResponse = data.content;
          } else if (data.message && typeof data.message === 'string') {
            visionResponse = data.message;
          } else {
            // If all else fails, stringify
            visionResponse = JSON.stringify(data, null, 2).substring(0, 1500);
          }
        }
        
        if (!visionResponse || visionResponse.trim() === '') {
          throw new Error('Empty response from Vision AI');
        }
        
        // Clean and format response
        visionResponse = visionResponse.trim();
        
        // Remove common prefixes
        visionResponse = visionResponse
          .replace(/^(Google:|Gemini:|AI:|Assistant:|Response:)\s*/gmi, '')
          .replace(/^\*\*(.*?)\*\*\s*/g, '')
          .trim();
        
        // Truncate if too long
        if (visionResponse.length > 2000) {
          visionResponse = visionResponse.substring(0, 1900) + 
            '\n\n... (response truncated due to length)';
        }

        // ====== SEND RESULT ======
        const resultText = 
          `🔍 *GOOGLE GEMINI VISION AI*\n\n` +
          `🎯 *Query:* ${query}\n\n` +
          `✨ *Analysis:*\n${visionResponse}\n\n` +
          `⚡ *Powered by Google Gemini Vision AI*\n` +
          `📸 *Image processed successfully*`;

        await sock.sendMessage(jid, {
          text: resultText,
          edit: statusMsg.key
        });

        console.log(`✅ Vision analysis completed`);

      } catch (apiError) {
        console.error('❌ API Error:', apiError.response?.data || apiError.message);
        
        // Try fallback API
        console.log('🔄 Trying fallback API...');
        
        try {
          const fallbackResponse = await axios({
            method: 'GET',
            url: 'https://apiskeith.vercel.app/ai/gemini-vision',
            params: {
              image: encodeURIComponent(base64Image), // Just base64
              q: encodeURIComponent(query)
            },
            timeout: 30000,
            headers: {
              'Accept': 'application/json'
            }
          });
          
          if (fallbackResponse.data && fallbackResponse.data.result) {
            let fallbackResult = fallbackResponse.data.result;
            fallbackResult = fallbackResult.substring(0, 2000);
            
            const fallbackText = 
              `🔍 *GOOGLE VISION AI*\n\n` +
              `🎯 *Query:* ${query}\n\n` +
              `✨ *Analysis:*\n${fallbackResult}\n\n` +
              `⚡ *Via alternative API*`;
              
            await sock.sendMessage(jid, {
              text: fallbackText,
              edit: statusMsg.key
            });
            
            console.log(`✅ Fallback API succeeded`);
          } else {
            throw apiError; // Re-throw if fallback also fails
          }
        } catch (fallbackError) {
          throw apiError; // Throw original error
        }
      }

    } catch (error) {
      console.error('❌ Vision AI Error:', error);
      
      let errorMessage = `❌ *VISION AI ERROR*\n\n`;
      
      if (error.response?.status === 429) {
        errorMessage += `• Rate limit exceeded\n• Please wait 2-3 minutes\n`;
      } else if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
        errorMessage += `• API server timeout\n• Try again in a moment\n`;
      } else if (error.message?.includes('download')) {
        errorMessage += `• Failed to download image\n• Send image again\n`;
      } else if (error.message?.includes('Empty response')) {
        errorMessage += `• No response from AI\n• Try different image\n`;
      } else {
        errorMessage += `• Error: ${error.message || 'Unknown error'}\n`;
      }
      
      errorMessage += `\n🔧 *Tips:*\n`;
      errorMessage += `• Use clear images\n`;
      errorMessage += `• Image < 5MB\n`;
      errorMessage += `• Formats: JPG, PNG\n`;
      errorMessage += `• Try \`${PREFIX}vision help\` for help`;
      
      await sock.sendMessage(jid, {
        text: errorMessage
      }, { quoted: m });
    }
  },
};

// Helper function to detect MIME type from buffer
function getMimeTypeFromBuffer(buffer) {
  const bytes = buffer.slice(0, 4);
  const hex = bytes.toString('hex').toLowerCase();
  
  if (hex.startsWith('ffd8ffe0') || hex.startsWith('ffd8ffe1') || hex.startsWith('ffd8ffe2')) {
    return 'image/jpeg';
  } else if (hex.startsWith('89504e47')) {
    return 'image/png';
  } else if (hex.startsWith('47494638')) {
    return 'image/gif';
  } else if (hex.startsWith('52494646') && buffer.slice(8, 12).toString() === 'WEBP') {
    return 'image/webp';
  }
  
  return null;
}
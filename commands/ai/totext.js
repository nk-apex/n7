// import axios from 'axios';
// import FormData from 'form-data';
// import fs from 'fs';
// import path from 'path';

// // Helper functions
// async function saveMediaToTemp(client, mediaNode, type) {
//   try {
//     const buffer = await client.downloadMediaMessage(mediaNode);
//     if (!buffer || buffer.length === 0) {
//       throw new Error('Empty buffer received');
//     }
    
//     const ext = type === "audio" ? ".mp3" : ".mp4";
//     const fileName = `temp_${Date.now()}${ext}`;
//     const tempDir = process.env.TMPDIR || '/tmp';
//     const filePath = path.join(tempDir, fileName);
    
//     fs.writeFileSync(filePath, buffer);
//     return filePath;
//   } catch (error) {
//     console.error('Save media error:', error.message);
//     throw error;
//   }
// }

// async function uploadToUguu(filePath) {
//   try {
//     const form = new FormData();
//     form.append('file', fs.createReadStream(filePath));
    
//     const { data } = await axios.post('https://uguu.se/upload.php', form, {
//       headers: form.getHeaders(),
//       timeout: 30000
//     });
    
//     if (data.success && data.files && data.files[0]?.url) {
//       return data.files[0].url;
//     }
//     throw new Error('Upload failed: ' + JSON.stringify(data));
//   } catch (error) {
//     console.error('Upload error:', error.message);
//     throw error;
//   }
// }

// export default {
//   name: "totext",
//   aliases: ["transcribe", "speech2text", "audio2text", "whisper", "stt"],
//   category: "ai",
//   description: "Convert audio/video to text using AI transcription",
  
//   async execute(sock, m, args, PREFIX) {
//     const jid = m.key.remoteJid;
    
//     // Extract the quoted message from contextInfo
//     const quotedMessage = m.message?.extendedTextMessage?.contextInfo?.quotedMessage;
    
//     if (!quotedMessage) {
//       return sock.sendMessage(jid, {
//         text: `❌ *NO QUOTED MESSAGE DETECTED*\n\n` +
//               `Please reply to an audio message first.\n\n` +
//               `📌 *How to use:*\n` +
//               `1. Receive or send an audio message\n` +
//               `2. Reply to that message with: *${PREFIX}totext*\n\n` +
//               `✨ *Example:*\n` +
//               `• Someone sends you a voice note\n` +
//               `• You reply: ${PREFIX}totext\n\n` +
//               `⚠️ *Note:* You must reply directly to the audio message.`
//       }, { quoted: m });
//     }
    
//     // Check for audio message
//     let mediaNode = null;
//     let mediaType = null;
    
//     if (quotedMessage.audioMessage) {
//       mediaType = "audio";
//       mediaNode = quotedMessage.audioMessage;
//       console.log('DEBUG - Found audioMessage in quotedMessage');
//     } 
//     else if (quotedMessage.videoMessage) {
//       mediaType = "video";
//       mediaNode = quotedMessage.videoMessage;
//       console.log('DEBUG - Found videoMessage in quotedMessage');
//     }
//     else {
//       return sock.sendMessage(jid, {
//         text: `❌ *NO AUDIO/VIDEO FOUND*\n\n` +
//               `The message you replied to doesn't contain audio or video.\n\n` +
//               `🔍 *What I found:*\n` +
//               `${Object.keys(quotedMessage).join(', ') || 'Nothing'}\n\n` +
//               `📌 *Please reply to:*\n` +
//               `• A voice note (🎤 microphone icon)\n` +
//               `• An audio file\n` +
//               `• A video with audio`
//       }, { quoted: m });
//     }
    
//     let filePath;
//     try {
//       // Send initial processing message
//       const statusMsg = await sock.sendMessage(jid, {
//         text: `🔄 *DOWNLOADING AUDIO...*\n\n` +
//               `Preparing audio for transcription...\n` +
//               `⏳ Please wait...`
//       }, { quoted: m });
      
//       // Get audio duration if available
//       const duration = mediaNode.seconds ? `${mediaNode.seconds} seconds` : 'Unknown';
//       const fileSize = mediaNode.fileLength ? `${Math.round(mediaNode.fileLength / 1024)} KB` : 'Unknown';
      
//       // Download and save the media
//       filePath = await saveMediaToTemp(sock, mediaNode, mediaType);
      
//       // Update status
//       await sock.sendMessage(jid, {
//         text: `📤 *UPLOADING TO SERVER...*\n\n` +
//               `Audio Info:\n` +
//               `• Duration: ${duration}\n` +
//               `• Size: ${fileSize}\n` +
//               `• Type: ${mediaType.toUpperCase()}\n\n` +
//               `⏳ Uploading...`,
//         edit: statusMsg.key
//       });
      
//       // Upload to uguu.se
//       const mediaUrl = await uploadToUguu(filePath);
      
//       // Update status
//       await sock.sendMessage(jid, {
//         text: `🎤 *TRANSCRIBING WITH AI...*\n\n` +
//               `Processing speech to text...\n` +
//               `⏳ This may take a moment...`,
//         edit: statusMsg.key
//       });
      
//       // Call transcription API
//       const apiUrl = `https://apiskeith.vercel.app/ai/transcribe?q=${encodeURIComponent(mediaUrl)}`;
//       console.log('DEBUG - Calling API:', apiUrl);
      
//       const { data: result } = await axios.get(apiUrl, {
//         timeout: 90000 // 90 seconds for longer audio
//       });
      
//       console.log('DEBUG - API Response status:', result?.status);
      
//       if (!result?.status || !result?.result?.text) {
//         throw new Error('No transcription text received from API');
//       }
      
//       const transcription = result.result.text.trim();
      
//       if (!transcription || transcription.length === 0) {
//         throw new Error('Empty transcription received');
//       }
      
//       // Format the transcription
//       const formattedText = transcription
//         .replace(/\s+/g, ' ')
//         .trim()
//         .replace(/([.!?])\s*/g, '$1\n\n');
      
//       // Count statistics
//       const wordCount = formattedText.split(/\s+/).filter(word => word.length > 0).length;
//       const charCount = formattedText.length;
//       const lineCount = formattedText.split('\n').filter(line => line.trim().length > 0).length;
      
//       // Create final response
//       const responseText = `✅ *TRANSCRIPTION COMPLETE*\n\n` +
//                           `🗣️ *Transcribed Text:*\n${formattedText}\n\n` +
//                           `📊 *Statistics:*\n` +
//                           `• Words: ${wordCount}\n` +
//                           `• Characters: ${charCount}\n` +
//                           `• Lines: ${lineCount}\n` +
//                           `• Audio Duration: ${duration}\n\n` +
//                           `⚡ *Powered by AI Speech Recognition*\n` +
//                           `✨ *Command:* ${PREFIX}totext`;
      
//       // Send the transcription
//       await sock.sendMessage(jid, {
//         text: responseText
//       }, { quoted: m });
      
//       // Update status to complete
//       await sock.sendMessage(jid, {
//         text: `✅ *PROCESSING COMPLETE!*\n\n` +
//               `Transcription sent successfully.`,
//         edit: statusMsg.key
//       });
      
//       // Send success reaction
//       await sock.sendMessage(jid, {
//         react: { text: '✅', key: m.key }
//       });
      
//     } catch (error) {
//       console.error('[TOTEXT ERROR]:', error.message);
//       console.error('[TOTEXT ERROR Stack]:', error.stack);
      
//       let errorMessage = `❌ *TRANSCRIPTION FAILED*\n\n`;
      
//       if (error.code === 'ETIMEDOUT' || error.message.includes('timeout')) {
//         errorMessage += `• Request timeout (90s)\n`;
//         errorMessage += `• Audio might be too long (207s)\n`;
//         errorMessage += `• Try with shorter audio (< 60s)\n\n`;
//       } 
//       else if (error.message.includes('No transcription') || error.message.includes('Empty transcription')) {
//         errorMessage += `• No speech detected\n`;
//         errorMessage += `• Audio might be silent or unclear\n\n`;
//       }
//       else if (error.message.includes('Upload failed')) {
//         errorMessage += `• Failed to upload to server\n`;
//         errorMessage += `• Check internet connection\n\n`;
//       }
//       else if (error.message.includes('Empty buffer')) {
//         errorMessage += `• Failed to download audio\n`;
//         errorMessage += `• Audio file might be corrupted\n\n`;
//       }
//       else if (error.message.includes('ENOTFOUND')) {
//         errorMessage += `• Cannot connect to API server\n`;
//         errorMessage += `• Try again later\n\n`;
//       }
//       else {
//         errorMessage += `• Error: ${error.message}\n\n`;
//       }
      
//       errorMessage += `💡 *TIPS FOR SUCCESS:*\n`;
//       errorMessage += `• Use clear audio with minimal background noise\n`;
//       errorMessage += `• Keep audio under 60 seconds\n`;
//       errorMessage += `• Speak clearly at normal pace\n`;
//       errorMessage += `• Ensure good microphone quality\n\n`;
      
//       errorMessage += `📌 *TRY AGAIN:*\n`;
//       errorMessage += `Reply to a shorter audio message with ${PREFIX}totext`;
      
//       await sock.sendMessage(jid, {
//         text: errorMessage
//       }, { quoted: m });
      
//       // Send error reaction
//       await sock.sendMessage(jid, {
//         react: { text: '❌', key: m.key }
//       });
      
//     } finally {
//       // Clean up temporary file
//       if (filePath && fs.existsSync(filePath)) {
//         try {
//           fs.unlinkSync(filePath);
//           console.log('DEBUG - Cleaned up temp file');
//         } catch (cleanupError) {
//           console.log('Cleanup error:', cleanupError.message);
//         }
//       }
//     }
//   }
// };
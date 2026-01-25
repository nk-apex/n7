import axios from "axios";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default {
  name: "image",
  aliases: ["img", "pic", "photo", "searchimage"],
  category: "Search",
  description: "Search and download images from the web",
  
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
        text: `📸 *Image Search*\n\n` +
              `💡 *Usage:*\n` +
              `• \`${PREFIX}image your search query\`\n` +
              `• \`${PREFIX}img nature landscapes\`\n` +
              `• \`${PREFIX}image cats -limit 5\`\n` +
              `• Reply to a message with \`${PREFIX}image\`\n\n` +
              `📌 *Examples:*\n` +
              `• \`${PREFIX}image beautiful sunset\`\n` +
              `• \`${PREFIX}img anime wallpapers\`\n` +
              `• \`${PREFIX}pic cute animals -limit 3\`\n` +
              `• \`${PREFIX}image car photos -limit 8\`\n` +
              `• Reply to "mountain views" with \`${PREFIX}image\`\n\n` +
              `🔤 *Aliases:* ${PREFIX}img, ${PREFIX}pic, ${PREFIX}photo, ${PREFIX}searchimage\n\n` +
              `⚠️ *Note:* Maximum 8 images per search`
      }, { quoted: m });
      return;
    }

    console.log(`📸 [IMAGE] Query: "${query}"`);

    try {
      // Parse limit from query
      let limit = 8; // Default limit
      const limitMatch = query.match(/-limit\s+(\d+)/i);
      if (limitMatch) {
        limit = parseInt(limitMatch[1]);
        limit = Math.min(Math.max(limit, 1), 10); // Limit between 1-10
        query = query.replace(limitMatch[0], '').trim();
      }

      // Send initial status
      const statusMsg = await sock.sendMessage(jid, { 
        text: `🔍 *Searching images:* "${query}"\n` +
              `📊 *Limit:* ${limit} images\n` +
              `⏳ *Please wait...*`
      }, { quoted: m });

      // Try multiple image APIs
      let images = [];
      let apiUsed = '';
      
      // Priority 1: Keith API
      try {
        const apiUrl = `https://apiskeith.vercel.app/search/images?query=${encodeURIComponent(query)}`;
        console.log(`🌐 [IMAGE] Trying Keith API: ${apiUrl}`);
        
        const response = await axios({
          method: 'GET',
          url: apiUrl,
          timeout: 30000,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Accept': 'application/json'
          }
        });

        console.log(`✅ [IMAGE] Keith API response status: ${response.status}`);
        
        if (response.data?.result && Array.isArray(response.data.result)) {
          images = response.data.result.slice(0, limit);
          apiUsed = 'Keith API';
          console.log(`✅ Found ${images.length} images via Keith API`);
        } else {
          throw new Error('Invalid response format from Keith API');
        }
      } catch (keithError) {
        console.log(`⚠️ [IMAGE] Keith API failed: ${keithError.message}`);
        
        // Priority 2: Alternative image API
        try {
          const altUrl = `https://api.beautyofweb.com/images?q=${encodeURIComponent(query)}&limit=${limit}`;
          console.log(`🌐 [IMAGE] Trying alternative API: ${altUrl}`);
          
          const altResponse = await axios({
            method: 'GET',
            url: altUrl,
            timeout: 25000,
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
          });

          if (altResponse.data?.images && Array.isArray(altResponse.data.images)) {
            images = altResponse.data.images.slice(0, limit);
            apiUsed = 'Alternative API';
            console.log(`✅ Found ${images.length} images via Alternative API`);
          } else if (altResponse.data?.results) {
            images = altResponse.data.results.slice(0, limit);
            apiUsed = 'Alternative API';
            console.log(`✅ Found ${images.length} images via Alternative API`);
          } else {
            throw new Error('No images from alternative API');
          }
        } catch (altError) {
          console.log(`❌ [IMAGE] Alternative API failed: ${altError.message}`);
          throw new Error('All image search APIs failed');
        }
      }

      if (images.length === 0) {
        await sock.sendMessage(jid, { 
          text: `❌ No images found for "${query}"\n\nTry:\n1. Different keywords\n2. More specific search\n3. Check spelling\n4. Try fewer images (-limit 3)`,
          edit: statusMsg.key 
        });
        return;
      }

      console.log(`📸 [IMAGE] Found ${images.length} images, downloading...`);
      
      await sock.sendMessage(jid, { 
        text: `🔍 *Found:* ${images.length} images ✅\n` +
              `📊 *Limit:* ${limit} images\n` +
              `⬇️ *Downloading images...*`,
        edit: statusMsg.key 
      });

      // Download and send images
      const successfulImages = [];
      
      for (let i = 0; i < Math.min(images.length, limit); i++) {
        const image = images[i];
        const imageUrl = image.url || image.link || image.source;
        
        if (!imageUrl || !imageUrl.startsWith('http')) {
          console.log(`⚠️ [IMAGE] Skipping invalid URL for image ${i + 1}`);
          continue;
        }

        try {
          // Download image
          const imageResponse = await axios({
            url: imageUrl,
            method: 'GET',
            responseType: 'arraybuffer',
            timeout: 20000,
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
              'Accept': 'image/*',
              'Referer': 'https://www.google.com/'
            }
          });

          if (imageResponse.status !== 200) {
            throw new Error(`HTTP ${imageResponse.status}`);
          }

          // Check content type
          const contentType = imageResponse.headers['content-type'];
          if (!contentType || !contentType.startsWith('image/')) {
            console.log(`⚠️ [IMAGE] Not an image: ${contentType}`);
            continue;
          }

          // Check file size (max 5MB for WhatsApp)
          const contentLength = imageResponse.headers['content-length'];
          if (contentLength && parseInt(contentLength) > 5 * 1024 * 1024) {
            console.log(`⚠️ [IMAGE] Image too large: ${Math.round(contentLength / 1024 / 1024)}MB`);
            continue;
          }

          const imageBuffer = Buffer.from(imageResponse.data);
          
          // Determine MIME type
          let mimeType = 'image/jpeg'; // default
          if (contentType.includes('png')) mimeType = 'image/png';
          if (contentType.includes('gif')) mimeType = 'image/gif';
          if (contentType.includes('webp')) mimeType = 'image/webp';
          
          // Send image
          await sock.sendMessage(jid, {
            image: imageBuffer,
            mimetype: mimeType,
            caption: `📸 *Image ${successfulImages.length + 1}/${Math.min(images.length, limit)}*\n` +
                     `🔍 *Search:* ${query}\n` +
                     `🔗 *Source:* ${apiUsed}`
          });
          
          successfulImages.push({
            buffer: imageBuffer,
            url: imageUrl,
            index: successfulImages.length + 1
          });
          
          console.log(`✅ [IMAGE] Sent image ${successfulImages.length}/${Math.min(images.length, limit)}`);
          
          // Small delay between images to avoid rate limiting
          if (i < Math.min(images.length, limit) - 1) {
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
          
        } catch (imgError) {
          console.error(`❌ [IMAGE] Failed to download image ${i + 1}:`, imgError.message);
          continue;
        }
      }

      if (successfulImages.length === 0) {
        await sock.sendMessage(jid, { 
          text: `❌ Failed to download any images.\n\nPossible issues:\n1. Image links expired\n2. Large file sizes\n3. Network restrictions\n4. Try different search`,
          edit: statusMsg.key 
        });
        return;
      }

      // Send summary
      await sock.sendMessage(jid, { 
        text: `✅ *Image Search Complete!*\n\n` +
              `🔍 *Query:* ${query}\n` +
              `📊 *Requested:* ${limit} images\n` +
              `✅ *Sent:* ${successfulImages.length} images\n` +
              `🔧 *API:* ${apiUsed}\n\n` +
              `💡 *Tips:*\n` +
              `• Use -limit flag for fewer/more images\n` +
              `• Be specific in your search\n` +
              `• Try different keywords`,
        edit: statusMsg.key 
      });

      console.log(`✅ [IMAGE] Successfully sent ${successfulImages.length} images for query: "${query}"`);

    } catch (error) {
      console.error('❌ [IMAGE] ERROR:', error.message);
      
      let errorMessage = `❌ *Image Search Error*\n\n`;
      
      if (error.message.includes('timeout')) {
        errorMessage += `• Request timed out (30s)\n`;
        errorMessage += `• Try simpler search\n`;
        errorMessage += `• Use -limit 3 for fewer images\n`;
      } else if (error.message.includes('network') || error.message.includes('connect')) {
        errorMessage += `• Network connection issue\n`;
        errorMessage += `• Check your internet\n`;
      } else if (error.message.includes('No images') || error.message.includes('failed')) {
        errorMessage += `• No images found\n`;
        errorMessage += `• Try different keywords\n`;
        errorMessage += `• Check spelling\n`;
      } else {
        errorMessage += `• Error: ${error.message}\n`;
      }
      
      errorMessage += `\n🔧 *Troubleshooting:*\n`;
      errorMessage += `1. Try \`${PREFIX}img simple query\`\n`;
      errorMessage += `2. Try \`${PREFIX}image cats -limit 3\`\n`;
      errorMessage += `3. Check internet connection\n`;
      errorMessage += `4. Try in 2 minutes\n`;
      
      await sock.sendMessage(jid, { 
        text: errorMessage
      }, { quoted: m });
    }
  }
};
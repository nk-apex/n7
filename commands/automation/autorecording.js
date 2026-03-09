// commands/owner/autorecording.js

// AutoRecording Manager (State Management)
const autoRecordingConfig = {
  enabled: false,
  duration: 10, // seconds
  activeRecorders: new Map(), // chatJid -> {intervalId, userCount, lastMessageTime, timeoutId}
  botSock: null,
  isHooked: false,
  ownerOnly: true, // Default to owner-only mode
  allowedUsers: new Set() // Users allowed to use command (besides owner)
};

class AutoRecordingManager {
  static initialize(sock) {
    if (!autoRecordingConfig.isHooked && sock) {
      autoRecordingConfig.botSock = sock;
      this.hookIntoBot();
      autoRecordingConfig.isHooked = true;
      console.log('🎤 Auto-recording system initialized!');
    }
  }

  static hookIntoBot() {
    if (!autoRecordingConfig.botSock || !autoRecordingConfig.botSock.ev) {
      console.log('⚠️ Could not hook into bot events');
      return;
    }
    
    // Add our handler alongside existing ones
    autoRecordingConfig.botSock.ev.on('messages.upsert', async (data) => {
      await this.handleIncomingMessage(data);
    });
    
    console.log('✅ Auto-recording successfully hooked into message events');
  }

  static async handleIncomingMessage(data) {
    try {
      if (!data || !data.messages || data.messages.length === 0) return;
      
      const m = data.messages[0];
      const sock = autoRecordingConfig.botSock;
      
      // Skip if not enabled or if it's from the bot itself
      if (!m || !m.key || m.key.fromMe || !autoRecordingConfig.enabled) return;
      
      // Check if it's a command (starts with prefix, usually ".")
      const messageText = m.message?.conversation || 
                         m.message?.extendedTextMessage?.text || 
                         m.message?.imageMessage?.caption || '';
      
      // Skip if it's a command (starts with dot or other prefixes)
      const trimmedText = messageText.trim();
      if (trimmedText.startsWith('.') || trimmedText.startsWith('!') || trimmedText.startsWith('/')) {
        return;
      }
      
      const userJid = m.key.participant || m.key.remoteJid;
      const chatJid = m.key.remoteJid;
      
      if (!userJid || !chatJid) return;
      
      // If chat already has active recording, reset the timer
      if (autoRecordingConfig.activeRecorders.has(chatJid)) {
        const recorderData = autoRecordingConfig.activeRecorders.get(chatJid);
        
        // Clear existing timeout
        if (recorderData.timeoutId) {
          clearTimeout(recorderData.timeoutId);
        }
        
        // Update user count and last message time
        recorderData.userCount++;
        recorderData.lastMessageTime = Date.now();
        
        // Set new timeout to stop recording
        recorderData.timeoutId = setTimeout(async () => {
          await this.stopRecording(chatJid);
        }, autoRecordingConfig.duration * 1000);
        
        autoRecordingConfig.activeRecorders.set(chatJid, recorderData);
        return;
      }
      
      // Start new recording session
      await this.startRecording(chatJid);
      
    } catch (err) {
      console.error("Auto-recording handler error:", err);
    }
  }

  static async startRecording(chatJid) {
    try {
      const sock = autoRecordingConfig.botSock;
      
      // Start recording indicator in this chat
      await sock.sendPresenceUpdate('recording', chatJid);
      
      let isRecording = true;
      
      // Function to keep recording alive
      const keepRecordingAlive = async () => {
        if (isRecording && autoRecordingConfig.enabled) {
          try {
            await sock.sendPresenceUpdate('recording', chatJid);
          } catch (err) {
            // Ignore errors in keep-alive
          }
        }
      };
      
      // Keep refreshing the recording indicator every 2 seconds
      const recordingInterval = setInterval(keepRecordingAlive, 2000);
      
      // Set timeout to stop recording after duration
      const timeoutId = setTimeout(async () => {
        await this.stopRecording(chatJid);
      }, autoRecordingConfig.duration * 1000);
      
      // Store recording data for this chat
      autoRecordingConfig.activeRecorders.set(chatJid, {
        intervalId: recordingInterval,
        userCount: 1,
        startTime: Date.now(),
        lastMessageTime: Date.now(),
        timeoutId: timeoutId,
        isRecording: true
      });
      
    } catch (err) {
      console.error("Start recording error:", err);
    }
  }

  static async stopRecording(chatJid) {
    try {
      if (!autoRecordingConfig.activeRecorders.has(chatJid)) {
        return;
      }
      
      const recorderData = autoRecordingConfig.activeRecorders.get(chatJid);
      const sock = autoRecordingConfig.botSock;
      
      // Clean up
      clearInterval(recorderData.intervalId);
      if (recorderData.timeoutId) {
        clearTimeout(recorderData.timeoutId);
      }
      
      autoRecordingConfig.activeRecorders.delete(chatJid);
      
      // Stop recording indicator
      try {
        await sock.sendPresenceUpdate('paused', chatJid);
      } catch (err) {
        // Ignore stop errors
      }
      
    } catch (err) {
      console.error("Stop recording error:", err);
    }
  }

  // Rest of the class methods remain the same...
  static isAuthorized(msg, extra = {}) {
    const senderJid = msg.key.participant || msg.key.remoteJid;
    
    if (msg.key.fromMe) return true;
    
    if (autoRecordingConfig.ownerOnly) {
      if (extra.jidManager) {
        return extra.jidManager.isOwner(msg);
      }
      return msg.key.fromMe;
    }
    
    if (autoRecordingConfig.allowedUsers.has(senderJid)) {
      return true;
    }
    
    if (extra.jidManager) {
      return extra.jidManager.isOwner(msg);
    }
    
    return false;
  }

  static toggle() {
    autoRecordingConfig.enabled = !autoRecordingConfig.enabled;
    console.log(`Auto-recording ${autoRecordingConfig.enabled ? 'ENABLED' : 'DISABLED'}`);
    
    if (!autoRecordingConfig.enabled) {
      this.clearAllRecorders();
    }
    
    return autoRecordingConfig.enabled;
  }

  static status() {
    return {
      enabled: autoRecordingConfig.enabled,
      duration: autoRecordingConfig.duration,
      activeSessions: autoRecordingConfig.activeRecorders.size,
      isHooked: autoRecordingConfig.isHooked,
      ownerOnly: autoRecordingConfig.ownerOnly,
      totalUsersRecording: this.getTotalUsersRecording()
    };
  }

  static getTotalUsersRecording() {
    let total = 0;
    autoRecordingConfig.activeRecorders.forEach(recorderData => {
      total += recorderData.userCount;
    });
    return total;
  }

  static setDuration(seconds) {
    if (seconds >= 1 && seconds <= 120) {
      autoRecordingConfig.duration = seconds;
      return true;
    }
    return false;
  }

  static toggleOwnerOnly() {
    autoRecordingConfig.ownerOnly = !autoRecordingConfig.ownerOnly;
    return autoRecordingConfig.ownerOnly;
  }

  static addAllowedUser(jid) {
    autoRecordingConfig.allowedUsers.add(jid);
    return true;
  }

  static removeAllowedUser(jid) {
    autoRecordingConfig.allowedUsers.delete(jid);
    return true;
  }

  static getAllowedUsers() {
    return Array.from(autoRecordingConfig.allowedUsers);
  }

  static clearAllRecorders() {
    autoRecordingConfig.activeRecorders.forEach((recorderData, chatJid) => {
      clearInterval(recorderData.intervalId);
      if (recorderData.timeoutId) {
        clearTimeout(recorderData.timeoutId);
      }
    });
    autoRecordingConfig.activeRecorders.clear();
  }

  static async manualRecording(sock, chatJid, duration, quotedMsg = null) {
    try {
      // Send initial message
      if (quotedMsg) {
        await sock.sendMessage(chatJid, {
          text: `🎤 *Voice Recording Simulation*\n\nI'll show 'recording...' for ${duration} seconds!`
        }, { quoted: quotedMsg });
      }
      
      // Start recording indicator
      await sock.sendPresenceUpdate('recording', chatJid);
      
      let isRecording = true;
      
      // Function to keep recording alive
      const keepRecordingAlive = async () => {
        if (isRecording) {
          await sock.sendPresenceUpdate('recording', chatJid);
        }
      };
      
      // Keep refreshing the recording indicator every 2 seconds
      const recordingInterval = setInterval(keepRecordingAlive, 2000);
      
      // Store this manual recording session
      const sessionKey = `manual_${chatJid}_${Date.now()}`;
      autoRecordingConfig.activeRecorders.set(sessionKey, {
        intervalId: recordingInterval,
        userCount: 1,
        startTime: Date.now(),
        isManual: true
      });
      
      // Stop after specified duration
      return new Promise((resolve) => {
        const manualTimeout = setTimeout(async () => {
          isRecording = false;
          
          if (autoRecordingConfig.activeRecorders.has(sessionKey)) {
            clearInterval(autoRecordingConfig.activeRecorders.get(sessionKey).intervalId);
            autoRecordingConfig.activeRecorders.delete(sessionKey);
            
            // Stop recording indicator
            await sock.sendPresenceUpdate('paused', chatJid);
            
            // Send completion message
            if (quotedMsg) {
              await sock.sendMessage(chatJid, {
                text: `✅ *Recording simulation complete!*\n\nRecorded for ${duration} seconds!`
              }, { quoted: quotedMsg });
            }
          }
          
          resolve();
        }, duration * 1000);
        
        // Store timeout ID
        const recorderData = autoRecordingConfig.activeRecorders.get(sessionKey);
        recorderData.timeoutId = manualTimeout;
        autoRecordingConfig.activeRecorders.set(sessionKey, recorderData);
      });
      
    } catch (err) {
      console.error("Manual recording error:", err);
      throw err;
    }
  }
}

// Main Command Export
export default {
  name: "autorecording",
  alias: ["record", "recording", "voicerec", "audiorec", "rec", "recsim"],
  desc: "Toggle auto fake recording when someone messages you 🎤",
  category: "Owner",
  usage: ".autorecording [on/off/duration/status/mode/users]",
  
  async execute(sock, m, args, PREFIX, extra) {
    try {
      const targetJid = m.key.remoteJid;
      
      // Initialize on first command use
      if (!autoRecordingConfig.isHooked) {
        autoRecordingConfig.botSock = sock;
        AutoRecordingManager.hookIntoBot();
        autoRecordingConfig.isHooked = true;
        console.log('🎤 Auto-recording system initialized!');
      }
      
      // ==================== OWNER CHECK ====================
      const isAuthorized = AutoRecordingManager.isAuthorized(m, extra);
      
      if (!isAuthorized) {
        const senderJid = m.key.participant || targetJid;
        const jidManager = extra?.jidManager;
        
        let errorMsg = `❌ *Owner Only Command!*\n\n`;
        errorMsg += `Only the bot owner can use this command.\n\n`;
        
        return sock.sendMessage(targetJid, {
          text: errorMsg
        }, { quoted: m });
      }
      // ==================== END OWNER CHECK ====================
      
      if (args.length === 0) {
        // Show status
        const status = AutoRecordingManager.status();
        const statusText = status.enabled ? "✅ *ENABLED*" : "❌ *DISABLED*";
        const modeText = status.ownerOnly ? "🔒 *Owner Only*" : "🌍 *Public*";
        
        await sock.sendMessage(targetJid, {
          text: `╭─⌈ 🎤 *AUTO-RECORDING* ⌋
│
│ ${statusText}
│ ${modeText}
│ Auto-Recording: ${status.enabled ? 'ON 🟢' : 'OFF 🔴'}
│ Duration: ${status.duration}s | Active: ${status.activeSessions}
│
├─⊷ *${PREFIX}autorecording on*
│  └⊷ Enable recording
├─⊷ *${PREFIX}autorecording off*
│  └⊷ Disable recording
├─⊷ *${PREFIX}autorecording <duration>*
│  └⊷ Set duration (1-120s)
├─⊷ *${PREFIX}autorecording status*
│  └⊷ Detailed info
╰───`
        }, { quoted: m });
        return;
      }
      
      const arg = args[0].toLowerCase();
      
      // Show detailed status
      if (arg === 'status' || arg === 'info') {
        const status = AutoRecordingManager.status();
        const allowedUsers = AutoRecordingManager.getAllowedUsers();
        
        let statusMsg = `🎤 *Auto-Recording Status* (Owner View)\n\n`;
        statusMsg += `📊 *System Status:*\n`;
        statusMsg += `├─ Enabled: ${status.enabled ? '✅ YES' : '❌ NO'}\n`;
        statusMsg += `├─ Duration: ${status.duration}s\n`;
        statusMsg += `├─ Mode: ${status.ownerOnly ? '🔒 Owner Only' : '🌍 Public'}\n`;
        statusMsg += `├─ Active Chats: ${status.activeSessions}\n`;
        statusMsg += `├─ Total Users: ${status.totalUsersRecording}\n`;
        statusMsg += `└─ Hooked: ${status.isHooked ? '✅' : '❌'}\n\n`;
        
        if (allowedUsers.length > 0 && !status.ownerOnly) {
          statusMsg += `👥 *Allowed Users:*\n`;
          allowedUsers.forEach((user, index) => {
            statusMsg += `${index + 1}. ${user}\n`;
          });
          statusMsg += `\n`;
        }
        
        if (status.activeSessions > 0) {
          statusMsg += `🎙️ *Active Recording Sessions:*\n`;
          autoRecordingConfig.activeRecorders.forEach((data, chatJid) => {
            const elapsed = Math.floor((Date.now() - data.startTime) / 1000);
            const remaining = Math.max(0, status.duration - elapsed);
            const chatType = chatJid.includes('@g.us') ? '👥 Group' : 
                           chatJid.startsWith('manual_') ? '🎤 Manual' : '👤 DM';
            statusMsg += `├─ ${chatType}\n`;
            statusMsg += `│  ├─ ID: ${chatJid}\n`;
            statusMsg += `│  ├─ Users: ${data.userCount}\n`;
            statusMsg += `│  ├─ Elapsed: ${elapsed}s\n`;
            statusMsg += `│  └─ Remaining: ${remaining}s\n`;
          });
        }
        
        return sock.sendMessage(targetJid, {
          text: statusMsg
        }, { quoted: m });
      }
      
      // Toggle on/off
      if (arg === 'on' || arg === 'enable' || arg === 'start') {
        const enabled = AutoRecordingManager.toggle();
        await sock.sendMessage(targetJid, {
          text: `🎤 *Auto-Recording ${enabled ? 'ENABLED' : 'DISABLED'}*

${enabled ? 'I will now automatically show **voice recording** when someone messages you! 🎙️✨' : 'Auto-recording has been turned off.'}

⚙️ *Current Settings:*
• Duration: ${AutoRecordingManager.status().duration}s
• Mode: ${AutoRecordingManager.status().ownerOnly ? '🔒 Owner Only' : '🌍 Public'}
• Active Chats: ${AutoRecordingManager.status().activeSessions}`
        }, { quoted: m });
        return;
      }
      
      if (arg === 'off' || arg === 'disable' || arg === 'stop') {
        const enabled = AutoRecordingManager.toggle();
        await sock.sendMessage(targetJid, {
          text: `🎤 *Auto-Recording ${enabled ? 'ENABLED' : 'DISABLED'}*

${enabled ? 'Auto-recording has been turned on! 🎙️✨' : 'I will no longer auto-record when messaged.'}`
        }, { quoted: m });
        return;
      }
      
      // Mode toggle (owner-only vs public)
      if (arg === 'mode' || arg === 'togglemode') {
        const ownerOnly = AutoRecordingManager.toggleOwnerOnly();
        await sock.sendMessage(targetJid, {
          text: `🔧 *Recording Mode Changed*

Mode: ${ownerOnly ? '🔒 *OWNER ONLY*' : '🌍 *PUBLIC*'}

${ownerOnly ? 
  'Only you (owner) can control auto-recording now.' : 
  'Anyone can use auto-recording commands now.\n\n⚠️ *Warning:* Public mode may allow others to spam recording.'
}

├─⊷ *${PREFIX}autorecording users add @user*
│  └⊷ Add allowed user
├─⊷ *${PREFIX}autorecording users list*
│  └⊷ View allowed users
╰───`
        }, { quoted: m });
        return;
      }
      
      // User management
      if (arg === 'users' || arg === 'user' || arg === 'allow') {
        const subCmd = args[1]?.toLowerCase();
        
        if (!subCmd || subCmd === 'list') {
          const allowedUsers = AutoRecordingManager.getAllowedUsers();
          let userList = `👥 *Allowed Users* (${allowedUsers.length})\n\n`;
          
          if (allowedUsers.length === 0) {
            userList += `No users added yet.\n`;
          } else {
            allowedUsers.forEach((user, index) => {
              userList += `${index + 1}. ${user}\n`;
            });
          }
          
          userList += `\n├─⊷ *${PREFIX}autorecording users add @user*\n│  └⊷ Add a user\n`;
          userList += `├─⊷ *${PREFIX}autorecording users remove @user*\n│  └⊷ Remove a user\n`;
          userList += `├─⊷ *${PREFIX}autorecording users clear*\n│  └⊷ Clear all users\n`;
          userList += `╰───`;
          
          return sock.sendMessage(targetJid, {
            text: userList
          }, { quoted: m });
        }
        
        if (subCmd === 'add' && args[2]) {
          const userToAdd = args[2].replace('@', '') + '@s.whatsapp.net';
          AutoRecordingManager.addAllowedUser(userToAdd);
          
          await sock.sendMessage(targetJid, {
            text: `✅ *User Added*\n\nAdded ${userToAdd} to allowed users list.\n\nThey can now use auto-recording commands.`
          }, { quoted: m });
          return;
        }
        
        if (subCmd === 'remove' && args[2]) {
          const userToRemove = args[2].replace('@', '') + '@s.whatsapp.net';
          AutoRecordingManager.removeAllowedUser(userToRemove);
          
          await sock.sendMessage(targetJid, {
            text: `✅ *User Removed*\n\nRemoved ${userToRemove} from allowed users list.`
          }, { quoted: m });
          return;
        }
        
        if (subCmd === 'clear') {
          autoRecordingConfig.allowedUsers.clear();
          
          await sock.sendMessage(targetJid, {
            text: `✅ *Users Cleared*\n\nAll allowed users have been removed.`
          }, { quoted: m });
          return;
        }
        
        // Invalid user command
        await sock.sendMessage(targetJid, {
          text: `╭─⌈ ❓ *RECORDING USERS* ⌋\n│\n├─⊷ *${PREFIX}autorecording users list*\n│  └⊷ View allowed users\n├─⊷ *${PREFIX}autorecording users add @user*\n│  └⊷ Add a user\n├─⊷ *${PREFIX}autorecording users remove @user*\n│  └⊷ Remove a user\n├─⊷ *${PREFIX}autorecording users clear*\n│  └⊷ Clear all users\n╰───`
        }, { quoted: m });
        return;
      }
      
      // Set duration
      const duration = parseInt(arg);
      if (!isNaN(duration) && duration >= 1 && duration <= 120) {
        const success = AutoRecordingManager.setDuration(duration);
        if (success) {
          await sock.sendMessage(targetJid, {
            text: `✅ *Duration Updated*

Recording duration set to ${duration} seconds.

${AutoRecordingManager.status().enabled ? '🎙️ Auto-recording is currently **ACTIVE**' : '💤 Auto-recording is **INACTIVE**'}
• Mode: ${AutoRecordingManager.status().ownerOnly ? '🔒 Owner Only' : '🌍 Public'}
• Active Chats: ${AutoRecordingManager.status().activeSessions}`
          }, { quoted: m });
        } else {
          await sock.sendMessage(targetJid, {
            text: `❌ *Invalid Duration*

Please use a number between 1 and 120 seconds.

Maximum recording time is 2 minutes (120 seconds).`
          }, { quoted: m });
        }
        return;
      }
      
      // Manual recording command
      if (arg === 'manual' || arg === 'now') {
        const manualDuration = args[1] ? parseInt(args[1]) : autoRecordingConfig.duration;
        
        if (isNaN(manualDuration) || manualDuration < 1 || manualDuration > 300) {
          await sock.sendMessage(targetJid, {
            text: `╭─⌈ ❌ *INVALID DURATION* ⌋\n│\n├─⊷ *${PREFIX}autorecording manual 15*\n│  └⊷ Use 1-300 seconds\n╰───`
          }, { quoted: m });
          return;
        }
        
        // Send initial message
        await sock.sendMessage(targetJid, {
          text: `🎤 *Manual Recording Simulation*

I'll show 'recording...' for ${manualDuration} seconds!`
        }, { quoted: m });
        
        // Do manual recording
        await AutoRecordingManager.manualRecording(sock, targetJid, manualDuration, m);
        return;
      }
      
      // If no valid command, show help
      await sock.sendMessage(targetJid, {
        text: `╭─⌈ 🎤 *AUTO-RECORDING* ⌋
│
├─⊷ *${PREFIX}autorecording on*
│  └⊷ Enable recording
├─⊷ *${PREFIX}autorecording off*
│  └⊷ Disable recording
├─⊷ *${PREFIX}autorecording <1-120>*
│  └⊷ Set duration
├─⊷ *${PREFIX}autorecording mode*
│  └⊷ Toggle access mode
├─⊷ *${PREFIX}autorecording users*
│  └⊷ Manage users
├─⊷ *${PREFIX}autorecording status*
│  └⊷ Detailed info
├─⊷ *${PREFIX}autorecording manual 10*
│  └⊷ Manual recording
╰───`
      }, { quoted: m });
      
    } catch (err) {
      console.error("AutoRecording command error:", err);
      await sock.sendMessage(m.key.remoteJid, {
        text: `❌ AutoRecording command failed: ${err.message}`
      }, { quoted: m });
    }
  }
};
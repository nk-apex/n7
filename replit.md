# Silent WolfBot - WhatsApp Bot

## Overview
Silent WolfBot is a WhatsApp bot built with Node.js and the Baileys library. It integrates various AI capabilities, anime-related features, group management tools, and automation commands directly into WhatsApp messaging. The project aims to provide a versatile and intelligent assistant for individual and group interactions, enhancing user experience through advanced functionalities like AI-powered chat, media processing, and sophisticated group moderation.

## User Preferences
I prefer iterative development, with a focus on delivering functional, tested components.
When I ask for a feature, please propose a high-level design first.
Before making any significant changes to the codebase, please ask for my approval.
I prefer clear and concise explanations for complex technical concepts.
Do not make changes to files within the `node_modules` directory.
Always ensure that new features are accompanied by appropriate documentation.

## System Architecture
The bot operates on Node.js 20, utilizing ESM modules. Its core logic resides in `index.js`, handling WhatsApp connections and command routing. Commands are organized by category within the `commands/` directory. Configuration is managed via `settings.js` for bot-specific parameters and `app.json` for deployment metadata.

**Key Directories:**
*   `lib/`: Shared source modules (sudo-store.js, warnings-store.js, supabase.js) - these are source code, NOT data files.
*   `data/`: Runtime JSON data files only (created automatically at runtime). Excluded from git except for structure.
*   `commands/`: Command handlers organized by category.

**Deployment Note (Feb 2026):** Source code modules were moved from `data/` to `lib/` to fix Pterodactyl panel deployment. The `.gitignore` excludes only JSON data files, not source code. The `lib/` store modules auto-create `data/` subdirectories on first run.

**Database Integration (Feb 2026):**
*   **Supabase (PostgreSQL)**: All bot data is dual-written to both local JSON and Supabase for cross-platform portability (Replit, VS Code, Pterodactyl).
*   **Strategy**: Writes go to JSON (sync, fast) AND Supabase (fire-and-forget, async). Reads use JSON first (instant), Supabase as fallback when JSON missing.
*   **Fallback**: If Supabase is unavailable, the bot works 100% from local JSON files - nothing breaks.
*   **Module**: `lib/supabase.js` provides connection management, health checks, CRUD helpers, and config get/set.
*   **Tables**: 13 tables defined in `supabase_setup.sql` - bot_configs, warnings, warning_limits, sudoers, sudo_config, lid_map, chatbot_conversations, chatbot_config, antidelete_messages, antidelete_statuses, welcome_goodbye, group_features, auto_configs.
*   **Environment Variables**: `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` (secrets).
*   **Migrated Systems**: warnings-store, sudo-store, chatbot (config + conversations), antidelete (settings/stats), antidelete-status (settings/stats), welcome, goodbye, antidemote, antipromote, autotyping, autoview, autoreact.

**Key Features & Implementations:**

*   **Antidelete System**: This system is always active, caching incoming messages and detecting deletions. It supports both private (DM to owner) and public (resend in chat) modes for deleted messages, including WhatsApp statuses. Persistence is handled via `./data/antidelete/antidelete.json`.
*   **W.O.L.F Chatbot (Wise Operational Learning Framework)**:
    *   **AI Models**: Supports GPT-5, Copilot, Claude, Grok, Blackbox, Google Bard, and Perplexity with automatic fallback.
    *   **Interactive Media**: Detects conversational intent for image generation, music playback, video download, and song download, leveraging existing bot commands. Vague requests trigger follow-up prompts, and reactions are used for status updates.
    *   **Chat Features**: Includes conversational memory (last 20 messages, 1-hour timeout per user) and context-aware prompting.
    *   **Persistence**: Configuration and conversations are stored in `./data/chatbot/`.
*   **Anti-ViewOnce System**: Detects and reveals ViewOnce messages, supporting private (DM to owner), public (reveal in chat), or disabled modes. Media is downloaded and saved to `./data/viewonce_private/`.
*   **Bot Mode System**: Allows the bot to operate in `public`, `groups`, `dms`, or `silent` (owner-only) modes, with persistence in `./bot_mode.json`.
*   **Welcome/Goodbye Systems**: Automatically sends customizable welcome/goodbye messages to new/leaving group members, supporting profile pictures and variables. Persistence is managed per-group in `./data/welcome_data.json` and `./data/goodbye_data.json`.
*   **Anti-Demote System**: Separate command (`antidemote`) that detects demotion events in real-time with detailed messages showing who demoted whom, timestamps, and contact names. Actions: `warn`, `kick`, or `revert`. Configured via `./data/antidemote/config.json`. Enabled by default.
*   **Anti-Promote System**: Separate command (`antipromote`) that monitors and controls admin promotions. Actions: `notify`, `warn`, `kick`, or `revert`. Configured via `./data/antipromote/config.json`. Disabled by default.
*   **Auto-Join/Follow System**: When new users DM the bot, automatically adds them to configured groups (using `groupParticipantsUpdate`) and sends channel follow links. Falls back to sending invite links if bot is not admin. Configured via `./data/autojoin/config.json`. Hardcoded default links included.
*   **AI Video Effects**: Generates videos or images using ephoto360 effects via the `mumaker` npm package, with custom text and API fallback.
*   **JARVIS Voice AI**: Utilizes GPT-5, Grok, Copilot, and Blackbox for AI responses, with cascading TTS fallbacks (Google TTS, StreamElements, VoiceRSS) and custom FFmpeg audio effects for a robotic voice.
*   **Autotyping System**: Displays a typing indicator in DMs, groups, or both for a configurable duration. Configuration is stored in `./data/autotyping/config.json`.
*   **Shazam Song Identification**: Identifies songs from audio or text search using AudD, Keith Shazam, and Ryzen Shazam APIs, with FFmpeg for audio processing.
*   **NGL Attack**: Implements an ethical hacking tool to send anonymous messages via the NGL API, with rate limiting.
*   **Sudo System**: Trusted users (sudos) who can use owner-level commands. Supports `addsudo`, `delsudo`, `listsudo`, `checksudo`, `clearsudo`, `sudomode` (on/off), `sudoinfo`, `mysudo` (check own status), `sudodebug`, and `linksudo`. Sudo users bypass bot mode restrictions and can use owner-only commands. Owner-exclusive actions (add/remove/clear sudo, toggle sudomode) are locked to the real owner only. Persistent storage via `./data/sudo/sudoers.json` and `./data/sudo/config.json`.
*   **Logo Watermark**: All 30+ canvas-based logo generators include a "Silent Wolf" watermark at the bottom and "Created by WOLFBOT" caption.
*   **VV Captions**: View-once downloads use "Retrieved by WOLFBOT" default caption. Customizable via `setvvcaption` command.
*   **Image Generator Captions**: AI image generators (imagine, flux, bing) use "Created by WOLFBOT" caption.
*   **Persistent Warn System**: Per-group warnings and limits saved to `./data/warnings/warnings.json` and `./data/warnings/limits.json`, surviving bot restarts.
*   **Approve/Reject All**: Group commands (`approveall`, `rejectall`) to bulk approve or reject pending group join requests using Baileys' `groupRequestParticipantsList` and `groupRequestParticipantsUpdate` APIs. Processes in batches of 5 with throttling.
*   **Chatbot Whitelist System**: W.O.L.F chatbot supports per-group and per-DM whitelisting. Commands: `addgroup`, `removegroup`, `listgroups`, `cleargroups` for groups; `adddm`, `removedm`, `listdms`, `cleardms` for DMs. When whitelists are set, the chatbot only responds in those specific chats. Config stored in `./data/chatbot/chatbot_config.json` with `allowedGroups` and `allowedDMs` arrays.

## External Dependencies
*   `@whiskeysockets/baileys`: Core WhatsApp Web API integration.
*   `axios`: For HTTP requests.
*   `express`: Used for the health check server in Heroku deployments.
*   `chalk`: For terminal output coloring.
*   `dotenv`: For loading environment variables.
*   `ffmpeg`: System dependency for media processing (e.g., audio conversion, video effects).
*   `mumaker`: Used for interacting with ephoto360 for AI video effects.
*   AudD, Keith Shazam, Ryzen Shazam APIs: For song identification.
*   GPT-5, Copilot, Claude, Grok, Blackbox, Google Bard, Perplexity APIs: For AI chatbot functionalities.
*   Google TTS, StreamElements, VoiceRSS APIs: For text-to-speech services.
*   NGL API: For the NGL attack feature.
*   YouTube APIs (`apiskeith.top`): For various YouTube media downloads and searches.

## Recent Changes (Feb 2026)

### Environment Migration
*   **Node.js Upgrade**: Upgraded from Node.js 18 to Node.js 20 to satisfy `@whiskeysockets/baileys` v7 engine requirement (Node.js 20+).

### Performance & Stability Improvements
*   **Memory Management**: Lowered memory thresholds (warning: 500MB, high: 700MB, critical restart: 900MB). Aggressive cache cleanup: LID cache capped at 2000→1000, group metadata 50→20, contacts 2000→1000, message store 200 max.
*   **Console Display Fix**: `displayIncomingMessage` converted from async to fully synchronous. Uses `getInstantSenderNumber()` which reads only from cache (no network calls). Messages now appear in console instantly when received, eliminating hours-long display lag.
*   **Antidelete Optimization**: Debounced `saveData()` with 30-second minimum interval (was every 10 messages). Message cache capped at 2000 entries with automatic pruning of oldest. Shutdown flush handler ensures data is saved on process exit.
*   **Defibrillator Removed (Feb 2026)**: Entire ProfessionalDefibrillator class removed. It ran 3 interval timers (heartbeat, health check, owner reports) that added overhead and WhatsApp message spam without providing real value (its "responsiveness test" only checked if an object existed in memory). Replaced with a lightweight `memoryMonitor` that only does the one useful thing: trims caches when memory exceeds 700MB (every 5min check).
*   **Session Decryption Recovery**: Added smart recovery for "failed to decrypt" / "bad mac" errors. Instead of full session reset, clears only signal keys (sender-key, session, pre-key, app-state-sync files) while preserving creds.json, then auto-reconnects.
*   **Incoming Message Console Display**: All incoming messages are displayed in a beautiful bordered console format showing sender name, phone number, group/DM origin, group name, message type icon, and content preview.
*   **Event Loop Optimization (Feb 2026)**: Fixed intermittent message processing delays caused by event loop blocking. Key changes: (1) Debounced `saveCreds` to batch credential file writes instead of blocking on every update, (2) Pre-imported all dynamic modules (welcome, goodbye, antidemote, antistatusmention) at startup to eliminate disk I/O from hot event handlers, (3) Added 5s timeout to heartbeat `sendPresenceUpdate` and 8s timeouts to all defibrillator notification messages to prevent hanging on degraded connections, (4) Made `resolveSenderFromGroup` fire-and-forget in command handler (was blocking with `await`), (5) Made `messages.update` handler non-blocking (antidelete/viewonce), (6) Added event loop lag monitor (logs warnings when lag exceeds 500ms), (7) Added yielding every 10 groups in `autoScanGroupsForSudo` to prevent blocking during large group scans.
*   **Disk Space Manager (Feb 2026)**: Added `DiskManager` to prevent ENOSPC (disk full) errors from blocking message processing. Features: (1) Automatic disk monitoring every 10min with warning at 50MB and critical at 20MB, (2) Periodic cleanup every 30min of session signal files (sender-key, pre-key, app-state-sync), old viewonce/antidelete media (>3 days), temp files, session backups, and truncation of status logs, (3) `safeWriteFile()` wrapper on all critical file writes that auto-triggers emergency cleanup on ENOSPC, (4) ENOSPC handling in message handler and saveCreds to prevent cascading failures, (5) Enhanced `.disk clean` and `.disk clean deep` commands for manual cleanup with detailed before/after reports.
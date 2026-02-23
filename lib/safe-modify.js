const PATCH_NAMES = ['critical_block', 'critical_unblock_to_single', 'regular_high', 'regular_low', 'regular'];

export async function safeModify(sock, mod, jid) {
  try {
    return await sock.chatModify(mod, jid);
  } catch (e) {
    if (!e.message?.includes('App state key')) throw e;

    console.log('[safeModify] App state key missing — requesting resync from WhatsApp...');

    try {
      await sock.resyncAppState(PATCH_NAMES, true);
      await new Promise(r => setTimeout(r, 5000));
      return await sock.chatModify(mod, jid);
    } catch (e2) {
      console.log(`[safeModify] Still failing after resync: ${e2.message}`);
    }
  }
}

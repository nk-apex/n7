const ALL_PATCH_NAMES = ['critical_block', 'critical_unblock_to_single', 'regular_high', 'regular_low', 'regular'];

export async function safeModify(sock, mod, jid) {
  try {
    return await sock.chatModify(mod, jid);
  } catch (e) {
    const errMsg = e.message || '';
    if (!errMsg.includes('App state key') && !errMsg.includes('could not find')) throw e;

    console.log('[safeModify] App state key missing — requesting resync from WhatsApp...');

    try {
      await sock.resyncAppState(ALL_PATCH_NAMES, true);
      await new Promise(r => setTimeout(r, 5000));
      return await sock.chatModify(mod, jid);
    } catch (e2) {
      console.log(`[safeModify] Still failing after resync: ${e2.message}`);
      throw e2;
    }
  }
}

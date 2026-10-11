/* Sandika letters sync — include with <script src="letters-sync.js" defer></script>.
   Set window.SANDIKA_SUPABASE_URL and window.SANDIKA_SUPABASE_ANON_KEY before loading. */
(function (window, document) {
  'use strict';
  const STORAGE_KEY = 'portal_letters_v1';
  const INTERVAL_MS = 60 * 1000;
  let inFlight = false;
  const log = (...args) => { try { console.warn('[letters-sync]', ...args); } catch (_) {} };

  function config() {
    const url = String(window.SANDIKA_SUPABASE_URL || '').replace(/\/$/, '');
    const key = String(window.SANDIKA_SUPABASE_ANON_KEY || '');
    return url && key ? { url, key } : null;
  }
  function readLocal() {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
      if (parsed && Array.isArray(parsed.letters)) return parsed.letters;
      log('local letters format is not an array; left unchanged.');
    } catch (err) { log('could not read local letters:', err); }
    return null;
  }
  function identity(row) {
    if (!row || typeof row !== 'object') return '';
    const val = row.id ?? row.tracking_no ?? row.trackingNo;
    return val == null ? '' : String(val);
  }
  function notifyPage() {
    try { if (typeof window.renderLetters === 'function') window.renderLetters(); } catch (err) { log('renderLetters failed:', err); }
    ['updateStatCards', 'updateStats', 'renderStats', 'updateDashboardStats'].forEach(name => {
      try { if (typeof window[name] === 'function') window[name](); } catch (err) { log(name + ' failed:', err); }
    });
    try { window.dispatchEvent(new CustomEvent('portal:letters-synced')); } catch (_) {}
  }
  async function sync() {
    if (inFlight) return;
    const cfg = config();
    if (!cfg) { log('Supabase URL/key not configured; sync skipped.'); return; }
    inFlight = true;
    try {
      const response = await fetch(cfg.url + '/rest/v1/letters?select=*&order=created_at.desc&limit=500', {
        method: 'GET', headers: { apikey: cfg.key, Authorization: 'Bearer ' + cfg.key, Accept: 'application/json' }
      });
      if (!response.ok) throw new Error('Supabase returned HTTP ' + response.status);
      const remote = await response.json();
      if (!Array.isArray(remote)) throw new Error('Unexpected letters response format');
      const local = readLocal();
      if (local === null) return; // preserve malformed/unreadable local data rather than replacing it
      const known = new Set(local.map(identity).filter(Boolean));
      let added = 0;
      remote.forEach(row => {
        const key = identity(row);
        if (key && !known.has(key)) { local.push(row); known.add(key); added++; }
      });
      if (added) {
        try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(local)); }
        catch (err) { log('could not save merged letters:', err); return; }
      }
      // Refresh UI after a successful fetch, including when there were no new rows.
      notifyPage();
    } catch (err) { log('remote sync failed; existing local letters were kept:', err); }
    finally { inFlight = false; }
  }
  window.SandikaLettersSync = { sync };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', sync, { once: true });
  else sync();
  window.setInterval(sync, INTERVAL_MS);
})(window, document);

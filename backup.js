/* ============================================================================
 * Pachaka Lokam — Backup & Restore Module (v1.0)
 *
 * 100% offline backup. Exports the entire Store.state to a single JSON file
 * (or .plenc when encrypted with a user passphrase via WebCrypto AES-GCM).
 * The file is delivered via the Android/iOS share sheet so the user can
 * route it to Drive / WhatsApp-to-self / email / Telegram — whichever is
 * already on their device.
 *
 * No backend. No accounts. The privacy story stays intact: you control the
 * file.
 *
 * Restore supports MERGE (default — additive, dedupe-aware) and REPLACE
 * (destructive — wipes current state). Merge is the right default for
 * "import on a new phone"; replace exists for migration.
 * ========================================================================== */

const BACKUP_MIME      = "application/json";
const BACKUP_MIME_ENC  = "application/octet-stream";
const BACKUP_VERSION   = 1;

// ---------- File creation ----------
function _backupFilename(encrypted) {
  const ts = todayKey();
  return encrypted ? `pachaka-lokam-backup-${ts}.plenc`
                   : `pachaka-lokam-backup-${ts}.json`;
}

function _buildBackupBlob(stateObj) {
  const wrapped = {
    app: "pachaka-lokam",
    v: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    state: stateObj,
  };
  return new Blob([JSON.stringify(wrapped)], { type: BACKUP_MIME });
}

// ---------- Encryption (optional, passphrase-derived AES-GCM) ----------
async function _deriveKey(passphrase, salt) {
  const enc = new TextEncoder();
  const baseKey = await crypto.subtle.importKey(
    "raw", enc.encode(passphrase), { name: "PBKDF2" }, false, ["deriveKey"]
  );
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", salt, iterations: 100000, hash: "SHA-256" },
    baseKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

async function _encryptJson(obj, passphrase) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv   = crypto.getRandomValues(new Uint8Array(12));
  const key  = await _deriveKey(passphrase, salt);
  const enc  = new TextEncoder();
  const ct   = new Uint8Array(await crypto.subtle.encrypt(
    { name: "AES-GCM", iv }, key, enc.encode(JSON.stringify(obj))
  ));
  // Container: magic "PLENC1" | salt(16) | iv(12) | ciphertext
  const magic = enc.encode("PLENC1");
  const out = new Uint8Array(magic.length + salt.length + iv.length + ct.length);
  let o = 0;
  out.set(magic, o); o += magic.length;
  out.set(salt, o);  o += salt.length;
  out.set(iv, o);    o += iv.length;
  out.set(ct, o);
  return out;
}

async function _decryptJson(buf, passphrase) {
  const dec = new TextDecoder();
  const magic = dec.decode(buf.slice(0, 6));
  if (magic !== "PLENC1") throw new Error("Not an encrypted Pachaka Lokam backup");
  const salt = buf.slice(6, 22);
  const iv   = buf.slice(22, 34);
  const ct   = buf.slice(34);
  const key  = await _deriveKey(passphrase, salt);
  const pt   = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, ct);
  return JSON.parse(dec.decode(pt));
}

// ---------- Export ----------
async function exportBackup({ encrypted = false, passphrase = "" } = {}) {
  if (encrypted && !passphrase) throw new Error("Passphrase required for encryption");

  let blob, filename;
  if (encrypted) {
    const wrapped = { app: "pachaka-lokam", v: BACKUP_VERSION,
                      exportedAt: new Date().toISOString(), state: Store.state };
    const ct = await _encryptJson(wrapped, passphrase);
    blob = new Blob([ct], { type: BACKUP_MIME_ENC });
    filename = _backupFilename(true);
  } else {
    blob = _buildBackupBlob(Store.state);
    filename = _backupFilename(false);
  }

  const file = new File([blob], filename, { type: blob.type });
  // Prefer the share sheet — best UX on Android (sends to Drive / WhatsApp /
  // Telegram / email seamlessly). Fall back to download anchor.
  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    try { await navigator.share({ files: [file], title: "Pachaka Lokam backup" });
          _markBackupTaken(); return; }
    catch (e) { /* user cancelled */ }
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1500);
  _markBackupTaken();
}

function _markBackupTaken() {
  Store.state.lastBackupAt = new Date().toISOString();
  Store.save();
  toast("Backup saved. Keep it safe — Drive, WhatsApp-to-yourself, or email all work.");
}

// ---------- Import ----------
async function _readFileAsText(file) {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(r.result);
    r.onerror = () => rej(new Error("File read failed"));
    r.readAsText(file);
  });
}
async function _readFileAsBytes(file) {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(new Uint8Array(r.result));
    r.onerror = () => rej(new Error("File read failed"));
    r.readAsArrayBuffer(file);
  });
}

async function importBackup(file, { mode = "merge", passphrase = "" } = {}) {
  let parsed;
  if (file.name.toLowerCase().endsWith(".plenc")) {
    if (!passphrase) throw new Error("Passphrase required for encrypted backup");
    const buf = await _readFileAsBytes(file);
    parsed = await _decryptJson(buf, passphrase);
  } else {
    const text = await _readFileAsText(file);
    parsed = JSON.parse(text);
  }
  if (!parsed || parsed.app !== "pachaka-lokam" || !parsed.state) {
    throw new Error("This doesn't look like a Pachaka Lokam backup file.");
  }

  if (mode === "replace") {
    Store.state = parsed.state;
    Store.migrate();
    Store.save();
    return { merged: false };
  }

  // Merge mode — additive, dedupe-aware. Existing user data wins on conflicts
  // for trackers (more recent) and pantry quantities (live). Favourites and
  // custom ingredients are unioned. Reminders/templates: imported wins only
  // if local doesn't have them.
  const cur = Store.state;
  const inc = parsed.state;

  // Favourites: union by name+slot
  cur.favourites ||= { meals: [], customIngredients: [] };
  cur.favourites.meals ||= [];
  cur.favourites.customIngredients ||= [];
  if (inc.favourites?.meals?.length) {
    const seen = new Set(cur.favourites.meals.map(m => m.name.toLowerCase() + "|" + m.slot));
    for (const m of inc.favourites.meals) {
      const key = (m.name || "").toLowerCase() + "|" + m.slot;
      if (!seen.has(key)) { cur.favourites.meals.push(m); seen.add(key); }
    }
  }

  // Custom ingredients: union by name (and ensure they exist in items[])
  if (inc.favourites?.customIngredients?.length) {
    const seenIng = new Set(cur.favourites.customIngredients.map(i => i.name.toLowerCase()));
    const seenItem = new Set(cur.items.map(i => i.name.toLowerCase()));
    for (const ing of inc.favourites.customIngredients) {
      const ln = (ing.name || "").toLowerCase();
      if (!seenIng.has(ln)) { cur.favourites.customIngredients.push(ing); seenIng.add(ln); }
      if (!seenItem.has(ln)) {
        cur.items.push({ id: uid(), name: ing.name, category: ing.category,
          unit: ing.unit, qty: 0, step: ing.step, defaultQty: ing.defaultQty,
          needsBuy: false, seasonal: (ing.category || "").includes("Seasonal") });
      }
    }
  }

  // Tracker: union per-month per-day, imported only fills blanks
  cur.tracker ||= { maid: {}, milk: {}, newspaper: {} };
  for (const k of ["maid", "milk", "newspaper"]) {
    cur.tracker[k] ||= {};
    const incK = inc.tracker?.[k] || {};
    for (const m of Object.keys(incK)) {
      cur.tracker[k][m] ||= {};
      for (const d of Object.keys(incK[m])) {
        if (cur.tracker[k][m][d] == null) cur.tracker[k][m][d] = incK[m][d];
      }
    }
  }

  // Reminders: import only if no overlapping titles
  if (inc.reminders?.length) {
    const titles = new Set((cur.reminders || []).map(r => (r.title || "").toLowerCase()));
    inc.reminders.forEach(r => {
      if (!titles.has((r.title || "").toLowerCase())) cur.reminders.push(r);
    });
  }

  // Settings: don't overwrite — settings are device-local preferences.
  // Template: take imported only if local has none.
  if (!cur.template && inc.template) cur.template = inc.template;

  // Special days: union by date+title
  cur.specialDays ||= [];
  if (inc.specialDays?.length) {
    const seen = new Set(cur.specialDays.map(s => s.date + "|" + s.title));
    inc.specialDays.forEach(s => {
      const key = s.date + "|" + s.title;
      if (!seen.has(key)) { cur.specialDays.push(s); seen.add(key); }
    });
  }

  Store.migrate();
  Store.save();
  return {
    merged: true,
    addedFavourites: (inc.favourites?.meals || []).length,
    addedIngredients: (inc.favourites?.customIngredients || []).length,
  };
}

// ---------- UI ----------
function backupEnsureModal() {
  if (document.getElementById("backup-modal")) return;
  const html = `
  <div id="backup-modal" class="pl-modal" role="dialog" aria-modal="true" aria-labelledby="backup-title">
    <div class="pl-modal-card">
      <header class="pl-modal-head">
        <h3 id="backup-title">💾 Backup &amp; Restore</h3>
        <button class="pl-icon-btn" id="backup-close" aria-label="Close">✕</button>
      </header>
      <div class="pl-modal-body">
        <section class="backup-section">
          <h4>Backup your data</h4>
          <p class="hint">Saves everything — favourites, kitchen, plans, trackers — to a single file. Send it to yourself on WhatsApp, Drive, or email.</p>
          <label class="pl-chip-toggle">
            <input type="checkbox" id="backup-encrypt" />
            <span>Protect with a passphrase</span>
          </label>
          <div id="backup-pass-row" style="display:none;margin-top:8px">
            <input type="password" id="backup-pass" placeholder="Choose a passphrase (don't forget it!)" autocomplete="new-password"/>
          </div>
          <div class="pl-modal-foot" style="margin-top:10px;padding:0">
            <button class="btn primary" id="backup-do">Create backup file</button>
          </div>
          <p class="pl-mini" id="backup-last"></p>
        </section>
        <hr style="border:0;border-top:1px solid #eee;margin:18px 0"/>
        <section class="backup-section">
          <h4>Restore from a backup</h4>
          <p class="hint">Pick a <code>.json</code> or <code>.plenc</code> backup file. Default mode is <b>merge</b> — keeps your current data, adds anything from the backup that's missing.</p>
          <input type="file" id="restore-file" accept=".json,.plenc,application/json" />
          <div id="restore-pass-row" style="display:none;margin-top:8px">
            <input type="password" id="restore-pass" placeholder="Backup passphrase" autocomplete="off"/>
          </div>
          <div class="pl-field-row" style="margin-top:8px">
            <label class="pl-chip-toggle"><input type="radio" name="restore-mode" value="merge" checked/> <span>Merge (safe)</span></label>
            <label class="pl-chip-toggle"><input type="radio" name="restore-mode" value="replace"/> <span>Replace everything</span></label>
          </div>
          <div class="pl-modal-foot" style="margin-top:10px;padding:0">
            <button class="btn" id="restore-do">Restore</button>
          </div>
        </section>
      </div>
    </div>
  </div>`;
  document.body.insertAdjacentHTML("beforeend", html);

  const close = () => document.getElementById("backup-modal").classList.remove("show");
  document.getElementById("backup-close").onclick = close;
  document.getElementById("backup-modal").addEventListener("click", e => {
    if (e.target.id === "backup-modal") close();
  });

  const enc = document.getElementById("backup-encrypt");
  enc.onchange = () => {
    document.getElementById("backup-pass-row").style.display = enc.checked ? "block" : "none";
  };

  document.getElementById("backup-do").onclick = async () => {
    const useEnc = document.getElementById("backup-encrypt").checked;
    const pass   = document.getElementById("backup-pass").value;
    if (useEnc && pass.length < 4) { alert("Passphrase too short."); return; }
    try { await exportBackup({ encrypted: useEnc, passphrase: pass }); }
    catch (e) { alert("Backup failed: " + e.message); }
  };

  document.getElementById("restore-file").onchange = (e) => {
    const f = e.target.files?.[0];
    document.getElementById("restore-pass-row").style.display =
      (f && f.name.toLowerCase().endsWith(".plenc")) ? "block" : "none";
  };

  document.getElementById("restore-do").onclick = async () => {
    const f = document.getElementById("restore-file").files?.[0];
    if (!f) { alert("Pick a backup file first."); return; }
    const mode = document.querySelector("input[name=restore-mode]:checked").value;
    const pass = document.getElementById("restore-pass").value;
    if (mode === "replace" && !confirm("Replace EVERYTHING with the backup? Your current data will be lost.")) return;
    try {
      const r = await importBackup(f, { mode, passphrase: pass });
      close();
      if (r.merged) {
        toast(`Merged: +${r.addedFavourites} favourites, +${r.addedIngredients} ingredients.`);
      } else {
        toast("Replaced from backup.");
      }
      // Force full re-render.
      ["renderToday","renderKitchen","renderGrocery","renderMealsTab","renderReminders","renderFestivalBanner"]
        .forEach(fn => { try { window[fn] && window[fn](); } catch {} });
    } catch (e) {
      alert("Restore failed: " + e.message);
    }
  };
}

function openBackupModal() {
  backupEnsureModal();
  const last = Store.state.lastBackupAt;
  const lastEl = document.getElementById("backup-last");
  if (last) {
    const days = Math.floor((Date.now() - new Date(last).getTime()) / 86400000);
    lastEl.textContent = `Last backup: ${days === 0 ? "today" : days + " day(s) ago"}`;
  } else {
    lastEl.textContent = "No backup taken yet.";
  }
  document.getElementById("backup-modal").classList.add("show");
}

// Monthly nudge: open the app, see the toast if your last backup is >30 days
// old. Non-intrusive — disappears in a few seconds, no modal, no nag.
function maybeNudgeBackup() {
  const last = Store.state.lastBackupAt;
  if (!last) {
    // First-run users: skip this nudge until they've used the app a bit.
    const hasData = (Store.state.favourites?.meals?.length || 0) > 0
                  || Object.keys(Store.state.plans || {}).length > 0;
    if (!hasData) return;
  }
  const lastMs = last ? new Date(last).getTime() : 0;
  const days = Math.floor((Date.now() - lastMs) / 86400000);
  if (!last || days > 30) {
    setTimeout(() => {
      toast(last
        ? `Last backup was ${days} days ago. Open Settings → Backup to save.`
        : "Tip: take a backup from Settings to protect your data.");
    }, 2500);
  }
}

function initBackupUI() {
  backupEnsureModal();
  const btn = document.getElementById("btn-backup");
  if (btn) btn.onclick = openBackupModal;
  maybeNudgeBackup();
}

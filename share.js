/* ============================================================================
 * Pachaka Lokam — Share & Import Module (v1.0)
 *
 * The ONLY online-touching feature in the app: shares meal plans / favourites
 * via a URL payload that the receiving app decodes locally. No data is sent
 * to any server — the share URL is just an envelope that opens the same
 * static PWA on the recipient's device.
 *
 * Payload formats (compact keys to fit WhatsApp's URL preview budget):
 *
 *   v1 single favourite:
 *     { v:1, k:"meal", from:"<sender>", d:{ n, s, t, b, sp, nv, p, r, no } }
 *
 *   v1 weekly plan:
 *     { v:1, k:"plan", from:"<sender>", d:{ ws, r, days:[ {b,l,t,d}, ... ] } }
 *
 * Encoding: JSON → UTF-8 → base64url. Prefix with "v1." for version.
 * Decoding: strip prefix → base64url decode → JSON.parse → validate.
 * ========================================================================== */

const SHARE_BASE = (typeof location !== "undefined" && location.origin && location.pathname)
  ? location.origin + location.pathname.replace(/[^/]*$/, "")
  : "https://pachakalokam.prashobhpaul.com/";

// ---------- Encode / decode ----------
function _b64urlEncode(str) {
  // Use TextEncoder so non-ASCII (Malayalam, Tamil, Telugu, Kannada
  // characters in dish names/notes) survives the round trip.
  const bytes = new TextEncoder().encode(str);
  let bin = ""; bytes.forEach(b => bin += String.fromCharCode(b));
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
function _b64urlDecode(s) {
  s = s.replace(/-/g, "+").replace(/_/g, "/");
  while (s.length % 4) s += "=";
  const bin = atob(s);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new TextDecoder().decode(bytes);
}

function encodePayload(payload) {
  const json = JSON.stringify(payload);
  return "v1." + _b64urlEncode(json);
}

function decodePayload(token) {
  if (!token || !token.startsWith("v1.")) throw new Error("Unsupported payload version");
  const json = _b64urlDecode(token.slice(3));
  const obj = JSON.parse(json);
  if (!obj || typeof obj !== "object") throw new Error("Bad payload");
  return obj;
}

// ---------- Builders (compact key form) ----------
function _favToWire(f) {
  return {
    n: f.name, s: f.slot, t: f.type || "favourite",
    b: f.base || [], sp: !!f.special, nv: !!f.nonVeg,
    p: f.priority || 2, r: f.regionTag || "", no: f.notes || ""
  };
}
function _wireToFav(d) {
  return {
    name: d.n || "", slot: d.s || "lunch", type: d.t || "favourite",
    base: Array.isArray(d.b) ? d.b : [],
    special: !!d.sp, nonVeg: !!d.nv,
    priority: d.p || 2, regionTag: d.r || "", notes: d.no || "",
    simple: true, source: "imported",
  };
}
function _planToWire(weekStart, region, days) {
  return {
    ws: weekStart, r: region,
    days: days.map(day => ({
      b: day.breakfast || "", l: day.lunch || "",
      t: day.tea || "",      d: day.dinner || ""
    }))
  };
}
function _wireToPlan(d) {
  return {
    weekStart: d.ws, region: d.r,
    days: (d.days || []).map(x => ({
      breakfast: x.b || "", lunch: x.l || "",
      tea: x.t || "",       dinner: x.d || ""
    }))
  };
}

// ---------- Build share URLs ----------
function buildFavouriteShareUrl(fav, fromName) {
  const payload = { v: 1, k: "meal", from: fromName || "", d: _favToWire(fav) };
  return SHARE_BASE + "?import=" + encodePayload(payload);
}

function buildPlanShareUrl(weekStart, region, days, fromName) {
  const payload = { v: 1, k: "plan", from: fromName || "",
                    d: _planToWire(weekStart, region, days) };
  return SHARE_BASE + "?import=" + encodePayload(payload);
}

// Footer line appended to every shared message. Doubles as the discovery
// path for recipients who don't yet have the app — the homepage is both the
// PWA and the link to the APK download (per the README install guide). Kept
// brief so it doesn't read as marketing.
const SHARE_FOOTER_TEXT = "— Pachaka Lokam · 100% offline kitchen & meal planner";
const SHARE_HOME_URL    = "https://pachakalokam.prashobhpaul.com";
const SHARE_GET_APP     = "Get the app: " + SHARE_HOME_URL;

// Build the dual-URL block that goes at the end of every share message.
// The install URL is listed first and labelled clearly so recipients who
// don't have the app can see it at a glance (instead of staring at a long
// import URL with a base64 token and wondering what it is). Existing users
// tap the second URL to do the actual import.
function _shareUrlBlock(importUrl) {
  const lines = [];
  lines.push("📥 Get the app — free, offline, no accounts:");
  lines.push(SHARE_HOME_URL);
  if (importUrl) {
    lines.push("");
    lines.push("📲 Already have Pachaka Lokam? Tap to import:");
    lines.push(importUrl);
  }
  return lines.join("\n");
}

// ---------- Render plan as plain text (the message body) ----------
function renderPlanAsText(weekStart, region, days, fromName, importUrl) {
  const lines = [];
  lines.push(`🍽️ Pachaka Lokam — ${region} meal plan`);
  if (fromName) lines.push(`from ${fromName}`);
  lines.push(`week of ${weekStart}`);
  lines.push("");
  const dnames = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
  days.forEach((d, i) => {
    const dt = new Date(weekStart); dt.setDate(dt.getDate() + i);
    lines.push(`*${dnames[dt.getDay()]} ${dt.getDate()}/${dt.getMonth()+1}*`);
    if (d.breakfast) lines.push(`  🌅 ${d.breakfast}`);
    if (d.lunch)     lines.push(`  🍛 ${d.lunch}`);
    if (d.tea)       lines.push(`  ☕ ${d.tea}`);
    if (d.dinner)    lines.push(`  🌙 ${d.dinner}`);
  });
  lines.push("");
  lines.push(_shareUrlBlock(importUrl));
  return lines.join("\n");
}

function renderFavouriteAsText(fav, fromName, importUrl) {
  const lines = [];
  lines.push(`🍽️ Recipe — *${fav.name}*`);
  if (fromName) lines.push(`from ${fromName}`);
  lines.push(`for ${fav.slot} · ${fav.nonVeg ? "non-veg" : "veg"}${fav.special ? " · special" : ""}`);
  if (fav.base?.length) lines.push(`ingredients: ${fav.base.join(", ")}`);
  if (fav.notes) { lines.push(""); lines.push(fav.notes); }
  lines.push("");
  lines.push(SHARE_FOOTER_TEXT);
  lines.push("");
  lines.push(_shareUrlBlock(importUrl));
  return lines.join("\n");
}

// ---------- Share via system sheet / clipboard ----------
async function shareText(title, text, url) {
  // Compose a single message body. WhatsApp/Telegram preview the URL via
  // the og: tags on pachakalokam.prashobhpaul.com — the text body still
  // displays cleanly even without preview rendering.
  const fullText = url ? `${text}\n\n${url}` : text;
  if (navigator.share) {
    try { await navigator.share({ title, text: fullText }); return true; }
    catch (e) { /* user cancelled or share unsupported */ }
  }
  try {
    await navigator.clipboard.writeText(fullText);
    toast("Copied — paste it into WhatsApp / Messages.");
    return true;
  } catch {
    // Surface the link in a fallback prompt for very old WebViews.
    prompt("Copy this and share:", fullText);
    return false;
  }
}

async function shareFavourite(fav) {
  const fromName = (Store.state.settings?.shareName || "").trim();
  const importUrl = buildFavouriteShareUrl(fav, fromName);
  const text = renderFavouriteAsText(fav, fromName, importUrl);
  // Pass empty url — both install + import URLs are already in the body.
  // This way both are visible to the recipient, properly labelled.
  await shareText(`Recipe: ${fav.name}`, text, "");
}

async function shareCurrentPlan() {
  const planEntries = Object.entries(Store.state.plans || {})
    .sort(([a], [b]) => a.localeCompare(b));
  if (!planEntries.length) {
    alert("Generate a 7-day plan first, then share it.");
    return;
  }
  // Pick the newest contiguous 7-day block starting from the most recent week.
  const last = planEntries.slice(-7);
  const weekStart = last[0][0];
  const days = last.map(([, m]) => ({
    breakfast: m.breakfast?.display || m.breakfast?.name || "",
    lunch:     m.lunch?.display     || m.lunch?.name     || "",
    tea:       m.tea?.display       || m.tea?.name       || "",
    dinner:    m.dinner?.display    || m.dinner?.name    || "",
  }));
  const fromName = (Store.state.settings?.shareName || "").trim();
  const region = getRegion();
  const importUrl = buildPlanShareUrl(weekStart, region, days, fromName);
  const text = renderPlanAsText(weekStart, region, days, fromName, importUrl);
  // Pass empty url — both install + import URLs are already in the body.
  await shareText("Meal plan", text, "");
}

async function shareGroceryList() {
  const ids = new Set(Store.state.grocery || Store.state.items.filter(i => i.needsBuy).map(i => i.id));
  const items = Store.state.items.filter(i => i.needsBuy || (Store.state.grocery || []).includes(i.id));
  if (!items.length) { alert("Your grocery list is empty."); return; }
  const byCat = {};
  items.forEach(i => { (byCat[i.category] ||= []).push(i); });
  const lines = ["🛒 Pachaka Lokam — Grocery list", ""];
  Object.entries(byCat).forEach(([cat, list]) => {
    lines.push(`*${cat}*`);
    list.forEach(i => lines.push(`  • ${i.name}${i.defaultQty ? ` — ${i.defaultQty}${i.unit || ""}` : ""}`));
    lines.push("");
  });
  // Grocery isn't a portable artefact (no import URL) — just the install URL.
  // _shareUrlBlock with no importUrl gives just the labelled install link.
  lines.push(SHARE_FOOTER_TEXT);
  lines.push("");
  lines.push(_shareUrlBlock(null));
  await shareText("Grocery list", lines.join("\n"), "");
}

// ---------- Import: URL handler + preview modal ----------
function shareEnsureModal() {
  if (document.getElementById("share-import-modal")) return;
  const html = `
  <div id="share-import-modal" class="pl-modal" role="dialog" aria-modal="true" aria-labelledby="share-import-title">
    <div class="pl-modal-card">
      <header class="pl-modal-head">
        <h3 id="share-import-title">📥 Imported recipe</h3>
        <button class="pl-icon-btn" id="share-import-close" aria-label="Close">✕</button>
      </header>
      <div class="pl-modal-body">
        <p class="hint" id="share-import-meta"></p>
        <div id="share-import-preview" class="share-preview"></div>
        <p class="pl-mini">This was shared with you. It does not include any data
          from the sender's pantry, grocery, or trackers.</p>
      </div>
      <footer class="pl-modal-foot">
        <button class="btn" id="share-import-discard">Discard</button>
        <button class="btn primary" id="share-import-accept">Add to my favourites</button>
      </footer>
    </div>
  </div>

  <div id="share-paste-modal" class="pl-modal" role="dialog" aria-modal="true" aria-labelledby="share-paste-title">
    <div class="pl-modal-card">
      <header class="pl-modal-head">
        <h3 id="share-paste-title">📥 Paste shared link</h3>
        <button class="pl-icon-btn" id="share-paste-close" aria-label="Close">✕</button>
      </header>
      <div class="pl-modal-body">
        <p class="hint">If a friend sent you a Pachaka Lokam link, paste it here to import the recipe — works fully offline.</p>
        <textarea id="share-paste-input" rows="3" placeholder="Paste link or token here…"
          style="width:100%;padding:10px;border:1px solid #ddd;border-radius:8px;font-family:monospace;font-size:12px"></textarea>
      </div>
      <footer class="pl-modal-foot">
        <button class="btn" id="share-paste-cancel">Cancel</button>
        <button class="btn primary" id="share-paste-go">Import</button>
      </footer>
    </div>
  </div>`;
  document.body.insertAdjacentHTML("beforeend", html);

  const close = () => document.getElementById("share-import-modal").classList.remove("show");
  document.getElementById("share-import-close").onclick = close;
  document.getElementById("share-import-discard").onclick = close;
  document.getElementById("share-import-modal").addEventListener("click", e => {
    if (e.target.id === "share-import-modal") close();
  });

  const closePaste = () => document.getElementById("share-paste-modal").classList.remove("show");
  document.getElementById("share-paste-close").onclick = closePaste;
  document.getElementById("share-paste-cancel").onclick = closePaste;
  document.getElementById("share-paste-go").onclick = () => {
    const raw = document.getElementById("share-paste-input").value.trim();
    if (!raw) return;
    closePaste();
    handleImportRaw(raw);
  };
}

function openSharePaste() {
  shareEnsureModal();
  document.getElementById("share-paste-input").value = "";
  document.getElementById("share-paste-modal").classList.add("show");
}

function handleImportRaw(raw) {
  // Accepts a full URL or a bare token. Pulls the import token out either way.
  let token = raw;
  try {
    const m = raw.match(/[?&]import=([^&]+)/);
    if (m) token = decodeURIComponent(m[1]);
  } catch {}
  let payload;
  try { payload = decodePayload(token); }
  catch (e) {
    alert("This link doesn't look like a valid Pachaka Lokam share. Make sure you copied the whole link.");
    return;
  }
  showImportPreview(payload);
}

function showImportPreview(payload) {
  shareEnsureModal();
  const body = document.getElementById("share-import-preview");
  const meta = document.getElementById("share-import-meta");
  const accept = document.getElementById("share-import-accept");
  const titleEl = document.getElementById("share-import-title");

  if (payload.k === "meal") {
    const f = _wireToFav(payload.d || {});
    titleEl.textContent = "📥 Imported recipe";
    meta.textContent = payload.from ? `Shared by ${payload.from}` : "Shared recipe";
    body.innerHTML = `
      <div class="fav-card" style="margin:0">
        <div class="fav-card-head">
          <strong>${escapeHtml(f.name)}</strong>
          <span class="fav-slot-tag">${({breakfast:"🌅 Breakfast",lunch:"🍛 Lunch",tea:"☕ Tea",dinner:"🌙 Dinner",any:"♻️ Any"})[f.slot] || f.slot}</span>
        </div>
        <div class="fav-card-meta">
          ${f.nonVeg ? '<span class="fav-tag nv">non-veg</span>' : '<span class="fav-tag veg">veg</span>'}
          ${f.special ? '<span class="fav-tag special">special</span>' : ""}
          ${f.regionTag ? `<span class="fav-tag region">${escapeHtml(f.regionTag)}</span>` : ""}
        </div>
        ${f.base?.length ? `<div class="fav-card-ing"><b>Ingredients:</b> ${f.base.map(escapeHtml).join(" · ")}</div>` : ""}
        ${f.notes ? `<div class="fav-card-notes">${escapeHtml(f.notes)}</div>` : ""}
      </div>`;
    accept.textContent = "Add to my favourites";
    accept.onclick = () => {
      // Add new ingredients to kitchen as a side effect.
      const known = new Set(Store.state.items.map(i => i.name.toLowerCase()));
      const newOnes = (f.base || []).filter(b => !known.has(b) && !STAPLE_INGREDIENTS.has(b));
      newOnes.forEach(n => Fav.addCustomIngredient({ name: cap(n) }));
      Fav.add(f);
      document.getElementById("share-import-modal").classList.remove("show");
      const extra = newOnes.length
        ? ` · ${newOnes.length} new ingredient(s) added to kitchen`
        : "";
      toast(`Imported "${f.name}" to favourites${extra}.`);
      try { renderToday(); renderKitchen(); renderMealsTab(); } catch {}
    };
  } else if (payload.k === "plan") {
    const plan = _wireToPlan(payload.d || {});
    titleEl.textContent = "📥 Imported meal plan";
    meta.textContent = payload.from
      ? `Shared by ${payload.from} · ${plan.region} · week of ${plan.weekStart}`
      : `${plan.region} meal plan · week of ${plan.weekStart}`;
    body.innerHTML = plan.days.map((d, i) => {
      const dt = new Date(plan.weekStart); dt.setDate(dt.getDate() + i);
      const day = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"][dt.getDay()];
      return `<div class="share-day">
        <div class="share-day-head">${day} ${dt.getDate()}/${dt.getMonth()+1}</div>
        <div class="share-day-body">
          ${d.breakfast ? `<div>🌅 ${escapeHtml(d.breakfast)}</div>` : ""}
          ${d.lunch     ? `<div>🍛 ${escapeHtml(d.lunch)}</div>` : ""}
          ${d.tea       ? `<div>☕ ${escapeHtml(d.tea)}</div>` : ""}
          ${d.dinner    ? `<div>🌙 ${escapeHtml(d.dinner)}</div>` : ""}
        </div>
      </div>`;
    }).join("");
    accept.textContent = "Save as my weekly template";
    accept.onclick = () => {
      // Save as the user's weekly template — non-destructive, doesn't replace
      // current plan unless they tap "Apply" on the template banner later.
      Store.state.template = {
        savedOn: new Date().toISOString().slice(0, 10),
        region: plan.region,
        days: plan.days,
        importedFrom: payload.from || "",
      };
      Store.save();
      document.getElementById("share-import-modal").classList.remove("show");
      toast("Saved as your weekly template. Open Meal Plan to apply.");
      try { renderMealsTab(); } catch {}
    };
  } else {
    alert("This share is in a format this version doesn't recognise yet.");
    return;
  }
  document.getElementById("share-import-modal").classList.add("show");
}

// Reads ?import=... at boot (URL deep-link from a shared message). If
// present, decodes and shows the preview modal, then strips the param so
// reload doesn't re-prompt.
function processBootImport() {
  try {
    const u = new URL(location.href);
    const tok = u.searchParams.get("import");
    if (!tok) return;
    u.searchParams.delete("import");
    history.replaceState(null, "", u.toString());
    let payload; try { payload = decodePayload(tok); }
    catch { toast("Couldn't read the shared link."); return; }
    showImportPreview(payload);
  } catch {}
}

function initShareUI() {
  shareEnsureModal();
  const planBtn = document.getElementById("btn-share-plan");
  const grocBtn = document.getElementById("btn-share-grocery");
  const pasteBtn = document.getElementById("btn-share-paste");
  if (planBtn) planBtn.onclick = shareCurrentPlan;
  if (grocBtn) grocBtn.onclick = shareGroceryList;
  if (pasteBtn) pasteBtn.onclick = openSharePaste;
  // Run boot import on next tick so the rest of UI mounts first.
  setTimeout(processBootImport, 50);
}

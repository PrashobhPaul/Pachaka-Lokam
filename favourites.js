/* ============================================================================
 * Pachaka Lokam — Favourites Module (v1.0)
 *
 * Lets users save custom meals (regional sub-styles, family recipes, imported
 * dishes from other users) that plug into the existing meal engine alongside
 * the curated regional rules. Custom ingredients added via this flow are
 * pushed into the kitchen and survive Reset Month.
 *
 * Schema (in Store.state.favourites):
 *   meals: [
 *     { id, name, slot, type, base, simple, special, nonVeg,
 *       priority, regionTag, weekdayHint, festivalOnly, notes,
 *       addedOn, source }
 *   ]
 *   customIngredients: [
 *     { id, name, category, unit, defaultQty, step }
 *   ]
 *
 * Engine integration: implemented in app.js getMealRules() — when favourites
 * exist for the active region, they are merged into the rules pool for the
 * matching slot and scored by the same simple/special/priority logic as
 * regional rules. No special path; no forced inclusion.
 * ========================================================================== */

const FAV_VERSION = 1;

// Map of common keywords → grocery category, used when guessing the category
// for a newly-added custom ingredient.
const CATEGORY_HINTS = [
  [/\b(dal|peas|chana|cowpea|moong|urad|rajma|besan|atta|aata|rice|rawa|sooji|vermicelli|jowar|ragi|millet|wheat|sugar|salt|jaggery|tamarind|tea|coffee)\b/i, "Staples & Pulses"],
  [/\b(chicken|fish|prawn|mutton|egg|beef|crab|squid)\b/i, "Non-Veg"],
  [/\b(milk|curd|yogurt|paneer|cheese|butter|ghee|cream|bread|bun|rusk|coconut milk)\b/i, "Dairy & Bakery"],
  [/\b(oil|sesame oil|coconut oil)\b/i, "Oils"],
  [/\b(masala|powder|spice|chilli|cumin|mustard|turmeric|cardamom|clove|cinnamon|fennel|fenugreek|coriander seed|garam)\b/i, "Spices"],
  [/\b(biscuit|cookie|chips|mixture|namkeen|murukku|snack)\b/i, "Snacks"],
  [/\b(banana|apple|mango|grape|orange|papaya|pomegranate|watermelon|kiwi|strawberry|melon|guava|berry|fruit)\b/i, "Fruits (Seasonal)"],
];

const SLOT_LABELS = { breakfast: "🌅 Breakfast", lunch: "🍛 Lunch", tea: "☕ Tea / Snack", dinner: "🌙 Dinner", any: "♻️ Any meal" };

const Fav = {
  // ---------- Pure helpers ----------
  uid() { return "fav_" + Math.random().toString(36).slice(2, 10); },

  ensureState() {
    Store.state.favourites ||= { meals: [], customIngredients: [] };
    Store.state.favourites.meals ||= [];
    Store.state.favourites.customIngredients ||= [];
  },

  list() { this.ensureState(); return Store.state.favourites.meals; },

  customIngredients() { this.ensureState(); return Store.state.favourites.customIngredients; },

  guessCategory(name) {
    const n = (name || "").toLowerCase();
    for (const [re, cat] of CATEGORY_HINTS) if (re.test(n)) return cat;
    return "Vegetables"; // safest default — most user-added items are produce
  },

  inferNonVeg(ingredients) {
    const blob = (ingredients || []).join(" ").toLowerCase();
    return /\b(chicken|fish|prawn|mutton|egg|beef|crab|squid|meat)\b/.test(blob);
  },

  // Match an ingredient name to an existing pantry item (fuzzy by lowercase).
  findItem(name) {
    const n = (name || "").trim().toLowerCase();
    if (!n) return null;
    return Store.state.items.find(i => i.name.toLowerCase() === n) || null;
  },

  // Add a custom ingredient to the kitchen + favourites.customIngredients ledger.
  // Idempotent: if an item with the same name already exists, this is a no-op.
  addCustomIngredient({ name, category, unit = "g", defaultQty = 100, step = 50 }) {
    name = (name || "").trim();
    if (!name) return null;
    if (this.findItem(name)) return this.findItem(name);
    category = category || this.guessCategory(name);
    const item = { id: uid(), name, category, unit, qty: 0, step,
      defaultQty, needsBuy: false, seasonal: category.includes("Seasonal") };
    Store.state.items.push(item);
    this.ensureState();
    Store.state.favourites.customIngredients.push({
      id: this.uid(), name, category, unit, defaultQty, step
    });
    Store.save();
    return item;
  },

  // ---------- CRUD ----------
  add(fav) {
    this.ensureState();
    const now = new Date().toISOString().slice(0, 10);
    const entry = {
      id: fav.id || this.uid(),
      name: (fav.name || "").trim(),
      slot: fav.slot || "lunch",
      type: fav.type || "favourite",
      base: (fav.base || []).map(s => s.toLowerCase().trim()).filter(Boolean),
      simple: fav.simple !== false,
      special: !!fav.special,
      nonVeg: fav.nonVeg != null ? !!fav.nonVeg : this.inferNonVeg(fav.base),
      priority: fav.priority || 2,
      regionTag: fav.regionTag || getRegion(),
      weekdayHint: fav.weekdayHint != null ? fav.weekdayHint : null,
      festivalOnly: !!fav.festivalOnly,
      notes: fav.notes || "",
      addedOn: fav.addedOn || now,
      source: fav.source || "self",
    };
    if (!entry.name) throw new Error("Favourite needs a name");
    // Dedupe by name+slot
    const existingIdx = Store.state.favourites.meals.findIndex(
      m => m.name.toLowerCase() === entry.name.toLowerCase() && m.slot === entry.slot
    );
    if (existingIdx >= 0) Store.state.favourites.meals[existingIdx] = entry;
    else Store.state.favourites.meals.push(entry);
    Store.save();
    return entry;
  },

  remove(id) {
    this.ensureState();
    Store.state.favourites.meals = Store.state.favourites.meals.filter(m => m.id !== id);
    Store.save();
  },

  get(id) { return this.list().find(m => m.id === id) || null; },

  // ---------- Engine adapter ----------
  // Used by getMealRules() in app.js to merge favourites into the active
  // region's rule pool. Returns an array of meal-rule-shaped objects.
  asRulesForSlot(slot) {
    return this.list()
      .filter(f => f.slot === slot || f.slot === "any")
      .map(f => ({
        name: f.name,
        type: f.type,
        base: f.base.slice(),
        simple: f.simple,
        special: f.special,
        nonVeg: f.nonVeg,
        priority: f.priority,
        isFavourite: true,
        favouriteId: f.id,
      }));
  },
};

// ============================================================================
// UI — Add / Manage Favourites modal
// ============================================================================

function favEnsureModal() {
  if (document.getElementById("fav-modal")) return;
  const html = `
  <div id="fav-modal" class="pl-modal" role="dialog" aria-modal="true" aria-labelledby="fav-modal-title">
    <div class="pl-modal-card">
      <header class="pl-modal-head">
        <h3 id="fav-modal-title">⭐ Add favourite meal</h3>
        <button class="pl-icon-btn" id="fav-close" aria-label="Close">✕</button>
      </header>
      <div class="pl-modal-body">
        <label class="pl-field">
          <span>Name <em class="pl-req">*</em></span>
          <input type="text" id="fav-name" placeholder="e.g. Kuzhi Mandi, Mysore Bonda, Amma's Sambar" />
        </label>
        <label class="pl-field">
          <span>Meal slot</span>
          <select id="fav-slot">
            <option value="breakfast">🌅 Breakfast</option>
            <option value="lunch" selected>🍛 Lunch</option>
            <option value="tea">☕ Tea / Snack</option>
            <option value="dinner">🌙 Dinner</option>
            <option value="any">♻️ Any meal</option>
          </select>
        </label>
        <label class="pl-field">
          <span>Main ingredients <em class="pl-hint">(comma separated — only the defining ones, staples like salt/oil/turmeric are auto-assumed)</em></span>
          <input type="text" id="fav-ingredients" placeholder="e.g. rice, chicken, mandi spice mix, onion, curd" />
        </label>
        <div id="fav-missing-ing" class="fav-missing" style="display:none"></div>
        <div class="pl-field-row">
          <label class="pl-chip-toggle">
            <input type="checkbox" id="fav-special" /> <span>Special / festive</span>
          </label>
          <label class="pl-chip-toggle">
            <input type="checkbox" id="fav-simple" checked /> <span>Simple everyday meal</span>
          </label>
          <label class="pl-chip-toggle">
            <input type="checkbox" id="fav-nonveg" /> <span>Non-veg (auto-detected if blank)</span>
          </label>
        </div>
        <label class="pl-field">
          <span>How often should we suggest this?</span>
          <select id="fav-priority">
            <option value="1">Often (priority 1)</option>
            <option value="2" selected>Normal (priority 2)</option>
            <option value="3">Rarely (priority 3)</option>
          </select>
        </label>
        <label class="pl-field">
          <span>Notes / cooking tip <em class="pl-hint">(optional)</em></span>
          <textarea id="fav-notes" rows="2" placeholder="e.g. Marinate chicken 30 min. Cook rice in same pot."></textarea>
        </label>
      </div>
      <footer class="pl-modal-foot">
        <button class="btn" id="fav-cancel">Cancel</button>
        <button class="btn primary" id="fav-save">Save favourite</button>
      </footer>
    </div>
  </div>

  <div id="fav-list-modal" class="pl-modal" role="dialog" aria-modal="true" aria-labelledby="fav-list-title">
    <div class="pl-modal-card">
      <header class="pl-modal-head">
        <h3 id="fav-list-title">⭐ My favourites</h3>
        <button class="pl-icon-btn" id="fav-list-close" aria-label="Close">✕</button>
      </header>
      <div class="pl-modal-body">
        <p class="hint">Your saved meals appear in suggestions alongside the regional menu.</p>
        <div id="fav-list-body" class="fav-grid"></div>
      </div>
      <footer class="pl-modal-foot">
        <button class="btn" id="fav-list-add">+ Add another favourite</button>
        <button class="btn primary" id="fav-list-done">Done</button>
      </footer>
    </div>
  </div>`;
  document.body.insertAdjacentHTML("beforeend", html);

  // Wire close + save handlers (idempotent — only attached once).
  const close = () => document.getElementById("fav-modal").classList.remove("show");
  document.getElementById("fav-close").onclick = close;
  document.getElementById("fav-cancel").onclick = close;
  document.getElementById("fav-modal").addEventListener("click", e => {
    if (e.target.id === "fav-modal") close();
  });
  document.getElementById("fav-save").onclick = favOnSave;
  document.getElementById("fav-ingredients").addEventListener("input", favPreviewMissing);
  document.getElementById("fav-name").addEventListener("input", favAutodetectNonVeg);

  const closeList = () => document.getElementById("fav-list-modal").classList.remove("show");
  document.getElementById("fav-list-close").onclick = closeList;
  document.getElementById("fav-list-done").onclick = closeList;
  document.getElementById("fav-list-add").onclick = () => { closeList(); openFavouriteAdd(); };
  document.getElementById("fav-list-modal").addEventListener("click", e => {
    if (e.target.id === "fav-list-modal") closeList();
  });
}

function openFavouriteAdd(prefill) {
  favEnsureModal();
  document.getElementById("fav-name").value = prefill?.name || "";
  document.getElementById("fav-slot").value = prefill?.slot || "lunch";
  document.getElementById("fav-ingredients").value = (prefill?.base || []).join(", ");
  document.getElementById("fav-special").checked = !!prefill?.special;
  document.getElementById("fav-simple").checked = prefill?.simple !== false;
  document.getElementById("fav-nonveg").checked = !!prefill?.nonVeg;
  document.getElementById("fav-priority").value = String(prefill?.priority || 2);
  document.getElementById("fav-notes").value = prefill?.notes || "";
  document.getElementById("fav-missing-ing").style.display = "none";
  document.getElementById("fav-modal").classList.add("show");
  setTimeout(() => document.getElementById("fav-name").focus(), 50);
}

function openFavouritesList() {
  favEnsureModal();
  renderFavouritesList();
  document.getElementById("fav-list-modal").classList.add("show");
}

function renderFavouritesList() {
  const body = document.getElementById("fav-list-body");
  if (!body) return;
  const favs = Fav.list();
  if (!favs.length) {
    body.innerHTML = `<p class="hint" style="text-align:center;padding:18px">
      No favourites yet. Tap <b>+ Add</b> to save your first one.</p>`;
    return;
  }
  body.innerHTML = favs.map(f => `
    <div class="fav-card" data-id="${f.id}">
      <div class="fav-card-head">
        <strong>${escapeHtml(f.name)}</strong>
        <span class="fav-slot-tag">${SLOT_LABELS[f.slot] || f.slot}</span>
      </div>
      <div class="fav-card-meta">
        ${f.nonVeg ? '<span class="fav-tag nv">non-veg</span>' : '<span class="fav-tag veg">veg</span>'}
        ${f.special ? '<span class="fav-tag special">special</span>' : ""}
        <span class="fav-tag">priority ${f.priority}</span>
        ${f.regionTag ? `<span class="fav-tag region">${escapeHtml(f.regionTag)}</span>` : ""}
      </div>
      ${f.base?.length ? `<div class="fav-card-ing">${f.base.map(escapeHtml).join(" · ")}</div>` : ""}
      ${f.notes ? `<div class="fav-card-notes">${escapeHtml(f.notes)}</div>` : ""}
      <div class="fav-card-actions">
        <button class="btn xs" data-fav-share="${f.id}">↗ Share</button>
        <button class="btn xs" data-fav-edit="${f.id}">✏ Edit</button>
        <button class="btn xs danger" data-fav-del="${f.id}">🗑 Delete</button>
      </div>
    </div>
  `).join("");
  body.querySelectorAll("[data-fav-del]").forEach(btn => btn.onclick = () => {
    if (confirm(`Delete favourite "${Fav.get(btn.dataset.favDel)?.name}"?`)) {
      Fav.remove(btn.dataset.favDel);
      renderFavouritesList();
      try { renderToday(); } catch {}
    }
  });
  body.querySelectorAll("[data-fav-edit]").forEach(btn => btn.onclick = () => {
    const f = Fav.get(btn.dataset.favEdit);
    if (!f) return;
    document.getElementById("fav-list-modal").classList.remove("show");
    openFavouriteAdd(f);
    document.getElementById("fav-modal").dataset.editId = f.id;
  });
  body.querySelectorAll("[data-fav-share]").forEach(btn => btn.onclick = () => {
    const f = Fav.get(btn.dataset.favShare);
    if (f && typeof shareFavourite === "function") shareFavourite(f);
  });
}

function favPreviewMissing() {
  const raw = document.getElementById("fav-ingredients").value || "";
  const tokens = raw.split(",").map(s => s.trim()).filter(Boolean);
  const box = document.getElementById("fav-missing-ing");
  if (!tokens.length) { box.style.display = "none"; return; }
  const known = new Set(Store.state.items.map(i => i.name.toLowerCase()));
  const staples = STAPLE_INGREDIENTS;
  const missing = tokens.filter(t => !known.has(t.toLowerCase()) && !staples.has(t.toLowerCase()));
  if (!missing.length) { box.style.display = "none"; return; }
  box.style.display = "block";
  box.innerHTML = `<b>New ingredients:</b> ${missing.map(m =>
    `<span class="fav-new-ing">${escapeHtml(m)}</span>`).join(" ")}
    <div class="hint" style="margin-top:4px">These will be added to your kitchen so the meal can be suggested when stocked.</div>`;
}

function favAutodetectNonVeg() {
  const name = document.getElementById("fav-name").value.toLowerCase();
  const ing  = document.getElementById("fav-ingredients").value.toLowerCase();
  const cb   = document.getElementById("fav-nonveg");
  if (cb.dataset.userTouched === "1") return;
  const blob = name + " " + ing;
  if (/\b(chicken|fish|prawn|mutton|egg|beef|crab|squid|meat|biriyani|biryani|kebab)\b/.test(blob)) {
    cb.checked = true;
  }
}
document.addEventListener("change", e => {
  if (e.target && e.target.id === "fav-nonveg") e.target.dataset.userTouched = "1";
});

function favOnSave() {
  const name = document.getElementById("fav-name").value.trim();
  if (!name) { alert("Please enter a name for the meal."); return; }
  const slot = document.getElementById("fav-slot").value;
  const raw = document.getElementById("fav-ingredients").value || "";
  const base = raw.split(",").map(s => s.trim().toLowerCase()).filter(Boolean);
  const special = document.getElementById("fav-special").checked;
  const simple = document.getElementById("fav-simple").checked;
  const nonVeg = document.getElementById("fav-nonveg").checked;
  const priority = parseInt(document.getElementById("fav-priority").value, 10) || 2;
  const notes = document.getElementById("fav-notes").value.trim();

  // Add any new ingredients to the kitchen + custom ledger.
  const known = new Set(Store.state.items.map(i => i.name.toLowerCase()));
  const newOnes = base.filter(b => !known.has(b) && !STAPLE_INGREDIENTS.has(b));
  newOnes.forEach(n => Fav.addCustomIngredient({ name: cap(n) }));

  const editId = document.getElementById("fav-modal").dataset.editId;
  const fav = Fav.add({
    id: editId || undefined,
    name, slot, base, special, simple, nonVeg, priority, notes,
    type: "favourite",
  });
  delete document.getElementById("fav-modal").dataset.editId;
  document.getElementById("fav-modal").classList.remove("show");

  let msg = `Saved "${fav.name}" to your favourites.`;
  if (newOnes.length) {
    msg += `\n\nAdded ${newOnes.length} new ingredient(s) to your kitchen: ${newOnes.map(cap).join(", ")}.`;
    msg += `\nStock them or mark "Out" to add to grocery.`;
  }
  // Lightweight toast — keeps existing alerts elsewhere consistent.
  if (typeof toast === "function") toast(msg); else alert(msg);

  try { renderKitchen(); renderToday(); renderMealsTab(); } catch {}
}

// ---------- Public init ----------
function initFavouritesUI() {
  Fav.ensureState();
  // Wire toolbar buttons that exist in index.html. Buttons added later
  // (e.g. via inline HTML on Today cards) attach their own handlers.
  const addBtn  = document.getElementById("btn-fav-add");
  const listBtn = document.getElementById("btn-fav-list");
  if (addBtn)  addBtn.onclick  = () => openFavouriteAdd();
  if (listBtn) listBtn.onclick = () => openFavouritesList();
}

// Tiny HTML escaper used by the favourites and import previews.
function escapeHtml(s) {
  return String(s == null ? "" : s)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

// Tiny non-blocking toast. Falls back to alert() if the toast container is
// missing from the DOM.
function toast(msg, ms = 3500) {
  let el = document.getElementById("pl-toast");
  if (!el) {
    el = document.createElement("div");
    el.id = "pl-toast";
    el.className = "pl-toast";
    document.body.appendChild(el);
  }
  el.textContent = msg;
  el.classList.add("show");
  clearTimeout(toast._t);
  toast._t = setTimeout(() => el.classList.remove("show"), ms);
}

/* Pachaka Lokam v2.0 — festivals, regions, special days, veg restrictions, buy-suggestions */
const STORAGE_KEY = "pl_state_v6";
const uid = () => Math.random().toString(36).slice(2, 10);
const cap = s => s[0].toUpperCase() + s.slice(1);
const isoWeek = d => { const x=new Date(d); x.setHours(0,0,0,0); x.setDate(x.getDate()+4-(x.getDay()||7));
  const y=new Date(x.getFullYear(),0,1); return `${x.getFullYear()}-W${String(Math.ceil(((x-y)/86400000+1)/7)).padStart(2,"0")}`; };
// Local-time keys (timezone-safe — avoids IST off-by-one from Date.toISOString)
const pad2 = n => String(n).padStart(2,"0");
const ymdLocal = d => `${d.getFullYear()}-${pad2(d.getMonth()+1)}-${pad2(d.getDate())}`;
const ymLocal  = d => `${d.getFullYear()}-${pad2(d.getMonth()+1)}`;
const todayKey = () => ymdLocal(new Date());
const monthKey = () => ymLocal(new Date());
const fmtDate = d => new Date(d).toLocaleDateString("en-IN",{weekday:"short",day:"numeric",month:"short"});

// Staple ingredients are assumed always available — never blocks a recipe.
const STAPLE_INGREDIENTS = new Set([
  "chilli","chilli powder","curry leaves","mustard","turmeric","cumin",
  "ginger","garlic","salt","oil","masala powder","general spices"
]);

// ===== STORE =====
const Store = {
  state: null,
  load() {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) { try { this.state = JSON.parse(raw); this.migrate(); return; } catch {} }
    // Try migrate from older versions
    for (const old of ["pl_state_v5","pl_state_v4","pl_state_v3"]) {
      const d = localStorage.getItem(old);
      if (d) { try { this.state = JSON.parse(d); this.migrate(); this.save(); return; } catch {} }
    }
    const items = [];
    GROCERY_SEED.forEach(g => {
      const seasonal = g.category.includes("Seasonal");
      g.items.forEach(([name, u]) => items.push({ id: uid(), name, category: g.category,
        unit: u.unit, qty: 0, step: u.step, defaultQty: u.defaultQty, needsBuy: false, seasonal }));
    });
    this.state = { items, plans: {}, reminders: REMINDER_SEED.map(r => ({ id: uid(), ...r })),
      notifiedDates: {}, settings: { beverage: "tea", region: "Kerala", festivalMode: "override" },
      template: null, templateDismissedWeek: null,
      tracker: { maid: {}, milk: {}, newspaper: {} },
      gasCylinder: { startDate: null },
      specialDays: [],       // [{id, date, title, type, meals:{breakfast,lunch,dinner}, recurring:bool}]
      vegRestrictions: { days: [], months: [] }, // days: [5] for Fridays; months: ["2026-04"]
      mealReminders: { enabled: true, breakfast: "07:30", lunch: "12:30", tea: "16:30", dinner: "19:30" },
      festivalNotifs: { enabled: true, leadDays: 1, morningTime: "08:00" },
      waterReminder: { ...WATER_REMINDER_DEFAULT },
      waterLog: {}, // { "YYYY-MM-DD": glassesCount }
    };
    this.save();
  },
  migrate() {
    this.state.settings ||= { beverage: "tea" };
    this.state.settings.beverage ||= "tea";
    this.state.settings.region ||= "Kerala";
    this.state.settings.festivalMode ||= "override";
    this.state.template ||= null;
    this.state.templateDismissedWeek ||= null;
    this.state.tracker ||= { maid: {}, milk: {}, newspaper: {} };
    this.state.tracker.maid ||= {};
    this.state.tracker.milk ||= {};
    this.state.tracker.newspaper ||= {};
    this.state.gasCylinder ||= { startDate: null };
    this.state.specialDays ||= [];
    this.state.vegRestrictions ||= { days: [], months: [] };
    this.state.mealReminders ||= { enabled: true, breakfast: "07:30", lunch: "12:30", tea: "16:30", dinner: "19:30" };
    this.state.festivalNotifs ||= { enabled: true, leadDays: 1, morningTime: "08:00" };
    this.state.waterReminder ||= { ...WATER_REMINDER_DEFAULT };
    this.state.waterLog ||= {};
    // Ensure new grocery items exist
    const existing = new Set(this.state.items.map(i => i.name));
    GROCERY_SEED.forEach(g => {
      const seasonal = g.category.includes("Seasonal");
      g.items.forEach(([name, u]) => {
        if (!existing.has(name)) {
          this.state.items.push({ id: uid(), name, category: g.category,
            unit: u.unit, qty: 0, step: u.step, defaultQty: u.defaultQty, needsBuy: false, seasonal });
        }
      });
    });
  },
  save() { localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state)); },
};

// ===== REGION-AWARE HELPERS =====
function getRegion() { return Store.state.settings.region || "Kerala"; }
function getCurries() { return REGION_CURRIES[getRegion()] || KERALA_CURRIES; }
function getMealRules() { return REGION_MEAL_RULES[getRegion()] || MEAL_RULES_KERALA; }

// ===== VEG RESTRICTION CHECK =====
function isVegOnly(dateStr) {
  const vr = Store.state.vegRestrictions;
  if (!vr) return false;
  const d = new Date(dateStr);
  const dow = d.getDay(); // 0=Sun
  if (vr.days && vr.days.includes(dow)) return true;
  if (vr.months && vr.months.includes(dateStr.slice(0,7))) return true;
  return false;
}

// ===== SPECIAL DAYS =====
function getSpecialDay(dateStr) {
  const sds = Store.state.specialDays || [];
  // Direct date match
  let found = sds.find(s => s.date === dateStr);
  if (found) return found;
  // Check recurring (same month-day every year)
  const mmdd = dateStr.slice(5); // "MM-DD"
  found = sds.find(s => s.recurring && s.date.slice(5) === mmdd);
  return found || null;
}

// ===== FESTIVAL SERVICE =====
const FestivalService = {
  getActive(region) {
    const today = todayKey();
    return FESTIVAL_DATA.find(f =>
      f.states.includes(region) && f.start <= today && f.end >= today
    ) || null;
  },
  getNext(region) {
    const today = todayKey();
    return FESTIVAL_DATA
      .filter(f => f.states.includes(region) && f.start > today)
      .sort((a,b) => a.start.localeCompare(b.start))[0] || null;
  },
  getDayIndex(festival) {
    return Math.floor((new Date(todayKey()) - new Date(festival.start)) / 86400000);
  },
  getDuration(festival) {
    return Math.floor((new Date(festival.end) - new Date(festival.start)) / 86400000) + 1;
  },
  getTodaysMeals(festival) {
    const mp = festival.mealPlan, dayIdx = this.getDayIndex(festival);
    if (mp.type === "festival") return mp.meals;
    if (mp.type === "progressive") {
      const de = (mp.days || []).find(d => d.dayOffset === dayIdx);
      return de ? de.meals : null;
    }
    if (mp.type === "pattern") {
      const key = (mp.pattern || [])[dayIdx];
      return key ? (mp.templates[key] || null) : null;
    }
    return null;
  },
  isPeakDay(festival) { return todayKey() === festival.peak; },
  getAllForRegion(region) {
    return FESTIVAL_DATA.filter(f => f.states.includes(region))
      .sort((a,b) => a.start.localeCompare(b.start));
  },
};

// ===== DEEP-LINK FROM MANIFEST SHORTCUTS (?tab=grocery etc.) =====
function activateTabFromQuery() {
  const params = new URLSearchParams(location.search);
  const target = params.get("tab");
  if (!target) return;
  const tabBtn = document.querySelector(`.tab[data-tab="${target}"]`);
  if (tabBtn) tabBtn.click();
}

// ===== TAB NAVIGATION =====
document.querySelectorAll(".tab").forEach(t => {
  t.onclick = () => {
    try {
      document.querySelectorAll(".tab").forEach(x => x.classList.remove("active"));
      document.querySelectorAll(".panel").forEach(x => x.classList.remove("active"));
      t.classList.add("active");
      const panel = document.getElementById(t.dataset.tab);
      if (panel) panel.classList.add("active");
      const safe = fn => { try { typeof fn === "function" && fn(); } catch (err) { console.error("[PL] tab render failed:", t.dataset.tab, err); } };
      if (t.dataset.tab === "today") safe(renderToday);
      if (t.dataset.tab === "grocery") safe(renderGrocery);
      if (t.dataset.tab === "kitchen") safe(renderKitchen);
      if (t.dataset.tab === "meals") safe(renderMealsTab);
      if (t.dataset.tab === "reminders") { safe(renderReminders); safe(renderTracker); }
      if (t.dataset.tab === "festivals") safe(renderFestivalsPanel);
      // Bulk action bar is only relevant on the kitchen tab.
      const bar = document.getElementById("kitchen-bulk-bar");
      if (bar && t.dataset.tab !== "kitchen") bar.style.display = "none";
      else if (bar && t.dataset.tab === "kitchen") { try { refreshKitchenBulkBar(); } catch {} }
    } catch (err) { console.error("[PL] tab switch failed:", err); }
  };
});

// ===== FESTIVAL BANNER =====
function renderFestivalBanner() {
  const el = document.getElementById("festival-banner");
  if (!el) return;
  const region = getRegion();
  const active = FestivalService.getActive(region);
  const next = !active ? FestivalService.getNext(region) : null;
  const specialDay = getSpecialDay(todayKey());

  if (specialDay && !active) {
    el.className = "festival-banner active special-day-banner";
    el.innerHTML = `<div class="fest-greeting">🎂 ${specialDay.title}</div>
      ${specialDay.meals ? `<div class="fest-meals">${Object.entries(specialDay.meals).map(([s,m])=>
        `<div class="fest-dish"><span>${s}</span>${m}</div>`).join("")}</div>` : ""}`;
  } else if (active) {
    const dayIdx = FestivalService.getDayIndex(active);
    const duration = FestivalService.getDuration(active);
    const pct = Math.round(((dayIdx + 1) / duration) * 100);
    const isPeak = FestivalService.isPeakDay(active);
    const meals = FestivalService.getTodaysMeals(active);
    let html = `<div class="fest-greeting">${isPeak ? "🎉 " : "🎊 "}${active.greeting}</div>`;
    html += `<div class="fest-progress"><span>${active.name} — Day ${dayIdx+1} of ${duration}</span>
      <div class="progress-bar"><div class="progress-fill" style="width:${pct}%"></div></div></div>`;
    if (meals) {
      html += `<div class="fest-meals">`;
      for (const [slot, items] of Object.entries(meals)) {
        const txt = Array.isArray(items) ? items.join(", ") : items;
        const icon = getMealIcon(Array.isArray(items) ? items[0] : items);
        html += `<div class="fest-dish"><span>${slot}</span><span class="dish-emoji">${icon}</span>${txt}</div>`;
      }
      html += `</div>`;
    }
    el.className = "festival-banner active";
    el.innerHTML = html;
  } else if (next) {
    const daysUntil = Math.floor((new Date(next.start) - new Date(todayKey())) / 86400000);
    el.className = "festival-banner upcoming";
    el.innerHTML = `<div class="fest-upcoming">Next: <b>${next.name}</b> in ${daysUntil} day${daysUntil===1?"":"s"} (${fmtDate(next.start)})</div>`;
  } else {
    el.className = "festival-banner";
    el.innerHTML = "";
  }
}

// ===== TODAY'S MEAL PLAN =====
function renderToday() {
  renderFestivalBanner();
  const key = todayKey();
  const p = pantry();
  const bev = Store.state.settings.beverage;
  const rules = getMealRules();
  const today = new Date();
  document.getElementById("today-date").textContent =
    today.toLocaleDateString("en-IN",{weekday:"long",day:"numeric",month:"long",year:"numeric"});

  // Veg-only indicator
  const vegBadge = document.getElementById("today-veg-badge");
  if (vegBadge) vegBadge.style.display = isVegOnly(key) ? "inline-block" : "none";

  // Special day indicator
  const specialDay = getSpecialDay(key);
  const specialBadge = document.getElementById("today-special-badge");
  if (specialBadge) {
    if (specialDay) { specialBadge.textContent = `🎂 ${specialDay.title}`; specialBadge.style.display = "inline-block"; }
    else specialBadge.style.display = "none";
  }

  renderGasCylinderWidget();

  const saved = Store.state.plans[key];
  const slots = [
    { id:"breakfast", icon:"🌅", label:"Breakfast" },
    { id:"lunch",     icon:"🍛", label:"Lunch" },
    { id:"tea",       icon:"☕", label:"Evening Tea" },
    { id:"dinner",    icon:"🌙", label:"Dinner" },
  ];

  const region = getRegion();
  const activeFest = FestivalService.getActive(region);
  const festMeals = activeFest ? FestivalService.getTodaysMeals(activeFest) : null;
  const festMode = Store.state.settings.festivalMode;

  slots.forEach(({ id }) => {
    const card = document.getElementById(`today-${id}`);
    if (!card) return;
    const saved_meal = saved && saved[id];
    const vegOnly = isVegOnly(key);
    const options = allCookable(id, p, bev, key);
    const current = saved_meal ? saved_meal.name : null;

    // Festival override
    const festOverride = festMeals && festMeals[id] && festMode === "override";
    const festLabel = card.querySelector(".fest-override-label");
    if (festLabel) {
      if (festOverride) {
        festLabel.textContent = `🎊 ${activeFest.name}: ${Array.isArray(festMeals[id]) ? festMeals[id].join(", ") : festMeals[id]}`;
        festLabel.style.display = "block";
      } else festLabel.style.display = "none";
    }

    // Special day meal override
    const specialMealLabel = card.querySelector(".special-day-label");
    if (specialMealLabel) {
      if (specialDay && specialDay.meals && specialDay.meals[id] && !festOverride) {
        specialMealLabel.textContent = `🎂 ${specialDay.title}: ${specialDay.meals[id]}`;
        specialMealLabel.style.display = "block";
      } else specialMealLabel.style.display = "none";
    }

    const sel = card.querySelector("select");
    sel.innerHTML = options.map(o =>
      `<option value="${o.name}" ${o.name===current?"selected":""}>${getMealIcon(o.name)} ${o.display}${o.fullyCookable?"":" ⚠"}</option>`
    ).join("");
    // If no fully cookable options, show buy suggestions
    if (!options.some(o => o.fullyCookable) && options.length) {
      sel.innerHTML += `<option disabled>── buy ingredients for ──</option>`;
    }
    if (!options.length) sel.innerHTML = `<option>— nothing available —</option>`;

    const disp = card.querySelector(".today-meal-display");
    const withIcon = (text, name) => `<span class="meal-emoji">${getMealIcon(name || text)}</span><span class="meal-name">${text}</span>`;
    if (festOverride) {
      const txt = Array.isArray(festMeals[id]) ? festMeals[id].join(", ") : festMeals[id];
      disp.innerHTML = withIcon(txt, txt);
      disp.className = "today-meal-display festival";
    } else if (saved_meal && saved_meal.display) {
      disp.innerHTML = withIcon(saved_meal.display, saved_meal.name);
      disp.className = "today-meal-display set";
    } else if (options.length && options[0].fullyCookable) {
      disp.innerHTML = withIcon(options[0].display, options[0].name);
      disp.className = "today-meal-display suggestion";
    } else if (options.length) {
      disp.innerHTML = withIcon(options[0].display + " ⚠", options[0].name);
      disp.className = "today-meal-display suggestion partial";
    } else {
      disp.textContent = "No suggestion — stock basics";
      disp.className = "today-meal-display empty";
    }

    // Missing ingredient buy-button for today's suggestion
    const missEl = card.querySelector(".today-missing");
    const bestMissing = (!saved_meal && options.length && options[0].missing.length) ? options[0].missing : (saved_meal && saved_meal.missing) || [];
    if (bestMissing.length) {
      missEl.innerHTML = `needs: ${bestMissing.join(", ")} <button class="btn xs buy-missing-btn">+ Buy</button>`;
      missEl.style.display = "inline-block";
      missEl.querySelector(".buy-missing-btn").onclick = () => {
        addMissingToGrocery(bestMissing);
        missEl.style.display = "none";
      };
    } else missEl.style.display = "none";

    sel.onchange = () => {
      const rule = getMealRules()[id].find(r => r.name === sel.value);
      const cooked = rule ? tryCook(rule, p, false) : null;
      if (!cooked) return;
      Store.state.plans[key] ||= {};
      Store.state.plans[key][id] = { name: cooked.name, display: cooked.display, missing: cooked.missing };
      Store.save();
      renderToday();
    };
  });
}

// ===== ADD MISSING INGREDIENTS TO GROCERY =====
function addMissingToGrocery(missingList) {
  let added = 0;
  missingList.forEach(name => {
    const tok = name.toLowerCase().trim();
    if (tok.includes(" ") && tok.includes("more item")) return; // skip "2 more item(s)" etc
    if (tok === "curry ingredients") return;
    const item = Store.state.items.find(i => i.name.toLowerCase() === tok);
    if (item && !item.needsBuy && item.qty === 0) { item.needsBuy = true; added++; }
  });
  if (added) { Store.save(); renderToday(); }
}

// ===== GAS CYLINDER WIDGET =====
function renderGasCylinderWidget() {
  const el = document.getElementById("gas-cylinder-widget");
  if (!el) return;
  const startDate = Store.state.gasCylinder.startDate;
  if (startDate) {
    const days = Math.floor((new Date() - new Date(startDate)) / 86400000);
    el.innerHTML = `<span class="gas-icon">🔥</span>
      <span class="gas-text">Gas cylinder: <b>${days} day${days===1?"":"s"}</b> since ${fmtDate(startDate)}</span>
      <button class="btn xs" id="btn-gas-new">New Cylinder</button>`;
    document.getElementById("btn-gas-new").onclick = () => {
      if (!confirm("Start tracking a new gas cylinder from today?")) return;
      Store.state.gasCylinder.startDate = todayKey();
      Store.save(); renderToday();
    };
  } else {
    el.innerHTML = `<span class="gas-icon">🔥</span>
      <span class="gas-text">No gas cylinder tracked</span>
      <button class="btn xs primary" id="btn-gas-start">Start Tracking</button>`;
    document.getElementById("btn-gas-start").onclick = () => {
      Store.state.gasCylinder.startDate = todayKey();
      Store.save(); renderToday();
    };
  }
}

document.getElementById("btn-today-from-template").onclick = () => {
  const key = todayKey();
  const tpl = Store.state.template;
  const p = pantry(), bev = Store.state.settings.beverage;
  const rules = getMealRules();
  if (!tpl) { alert("No weekly template saved yet."); return; }
  const dow = new Date().getDay();
  const dayPlan = tpl[dow];
  if (!dayPlan) { alert("No template entry for today."); return; }
  Store.state.plans[key] = {};
  for (const slot of ["breakfast","lunch","tea","dinner"]) {
    const want = dayPlan[slot]; if (!want) continue;
    const rule = rules[slot].find(m => m.name === want.name);
    const cooked = rule ? tryCook(rule, p, true) : null;
    if (cooked) Store.state.plans[key][slot] = { name: cooked.name, display: cooked.display, missing: [] };
    else {
      const opts = allCookable(slot, p, bev, key).filter(c => c.fullyCookable);
      const sub = opts[0];
      Store.state.plans[key][slot] = sub
        ? { name: sub.name, display: sub.display + " ↺", missing: [] }
        : { name: want.name, display: want.name + " (missing)", missing: ["ingredients"] };
    }
  }
  Store.save(); renderToday();
};

document.getElementById("btn-today-suggest").onclick = () => {
  const key = todayKey();
  const p = pantry(), bev = Store.state.settings.beverage;
  const recent = { breakfast:[], lunch:[], tea:[], dinner:[] };
  const meals = {};
  for (const slot of ["breakfast","lunch","tea","dinner"]) {
    const pick = pickMeal(slot, p, recent[slot], bev, key);
    if (pick) {
      meals[slot] = { name: pick.name, display: pick.display, missing: pick.missing };
      recent[slot].push(pick.name);
    } else {
      // Even when nothing is fully cookable, find best partial match and suggest buying
      const partials = allCookable(slot, p, bev, key);
      if (partials.length) {
        meals[slot] = { name: partials[0].name, display: partials[0].display + " ⚠", missing: partials[0].missing };
      } else {
        meals[slot] = { name: null, display: "No suggestion — stock basics", missing: [] };
      }
    }
  }
  Store.state.plans[key] = meals;
  Store.save(); renderToday();
};

// ===== KITCHEN =====
// Bulk-edit selection set (item ids). When non-empty, the floating action bar appears.
const kitchenSelected = new Set();

function refreshKitchenBulkBar() {
  const bar = document.getElementById("kitchen-bulk-bar");
  if (!bar) return;
  const n = kitchenSelected.size;
  const countEl = document.getElementById("kbb-count");
  if (countEl) countEl.textContent = `${n} selected`;
  bar.style.display = n ? "flex" : "none";
}

function renderKitchen() {
  const root = document.getElementById("kitchen-groups"); root.innerHTML = "";
  const groups = {};
  Store.state.items.forEach(it => { (groups[it.category] ||= []).push(it); });
  Object.entries(groups).forEach(([cat, items]) => {
    const stocked = items.filter(i => i.qty > 0), empty = items.filter(i => i.qty === 0);
    const div = document.createElement("div"); div.className = "category";
    div.innerHTML = `<h3><span class="cat-icon">${getCategoryIcon(cat)}</span>${cat} <span class="count">${stocked.length}/${items.length} stocked</span></h3>
      <div class="items stocked-grid"></div>
      ${empty.length ? `<details><summary>Not in kitchen (${empty.length})</summary><div class="items empty-grid"></div></details>` : ""}`;
    const sBox = div.querySelector(".stocked-grid"), eBox = div.querySelector(".empty-grid");

    const buildItem = (it, isStocked) => {
      const el = document.createElement("div");
      el.className = "item " + (isStocked ? "stocked" : "empty");
      const checked = kitchenSelected.has(it.id) ? "checked" : "";
      const icon = getItemIcon(it.name);
      if (isStocked) {
        el.innerHTML = `
          <input type="checkbox" class="bulk-check" ${checked} aria-label="Select ${it.name}" />
          <span class="item-icon">${icon}</span>
          <span class="name">${it.name}</span>
          <input type="number" class="qty" value="${it.qty}" min="0" step="${it.step}" />
          <span class="unit">${it.unit}</span>
          <button class="btn xs out-btn" type="button">Out</button>`;
      } else {
        el.innerHTML = `
          <input type="checkbox" class="bulk-check" ${checked} aria-label="Select ${it.name}" />
          <span class="item-icon">${icon}</span>
          <span class="name">${it.name}</span>
          <span class="unit">${it.unit}</span>
          <button class="btn xs primary got-btn" type="button">Got it</button>
          <button class="btn xs buy-btn" type="button">+ Buy</button>`;
      }
      const cb = el.querySelector(".bulk-check");
      const toggleSelected = () => {
        cb.checked = !cb.checked;
        if (cb.checked) kitchenSelected.add(it.id); else kitchenSelected.delete(it.id);
        el.classList.toggle("selected", cb.checked);
        refreshKitchenBulkBar();
      };
      cb.onchange = () => {
        if (cb.checked) kitchenSelected.add(it.id); else kitchenSelected.delete(it.id);
        el.classList.toggle("selected", cb.checked);
        refreshKitchenBulkBar();
      };
      // Tap on the row (but not on inputs/buttons) toggles selection — easier on mobile.
      el.addEventListener("click", e => {
        if (e.target === cb) return;
        if (e.target.closest("input,button")) return;
        toggleSelected();
      });
      if (kitchenSelected.has(it.id)) el.classList.add("selected");
      const qty = el.querySelector(".qty");
      if (qty) qty.onchange = () => { const v=parseFloat(qty.value)||0; it.qty=v; if(v===0) it.needsBuy=true; Store.save(); renderKitchen(); };
      const out = el.querySelector(".out-btn");
      if (out) out.onclick = e => { e.preventDefault(); it.qty=0; it.needsBuy=true; Store.save(); renderKitchen(); };
      const got = el.querySelector(".got-btn");
      if (got) got.onclick = e => { e.preventDefault(); it.qty=it.defaultQty; it.needsBuy=false; Store.save(); renderKitchen(); };
      const buy = el.querySelector(".buy-btn");
      if (buy) buy.onclick = e => { e.preventDefault(); it.needsBuy=true; Store.save(); renderKitchen(); };
      return el;
    };

    stocked.forEach(it => sBox.appendChild(buildItem(it, true)));
    if (eBox) empty.forEach(it => eBox.appendChild(buildItem(it, false)));
    root.appendChild(div);
  });
  refreshKitchenBulkBar();
}

function applyBulkKitchen(action) {
  if (!kitchenSelected.size) return;
  let changed = 0;
  Store.state.items.forEach(it => {
    if (!kitchenSelected.has(it.id)) return;
    if (action === "stock") { it.qty = it.defaultQty; it.needsBuy = false; changed++; }
    else if (action === "out") { it.qty = 0; it.needsBuy = true; changed++; }
    else if (action === "buy") { it.needsBuy = true; changed++; }
  });
  if (changed) {
    kitchenSelected.clear();
    Store.save();          // single bulk save
    renderKitchen();
  }
}

document.getElementById("btn-reset-month").onclick = () => {
  if (!confirm("Reset month?")) return;
  Store.state.items.forEach(it => { it.qty=0; it.needsBuy=true; });
  Store.save(); renderKitchen();
};

// Bulk action bar wiring (buttons live in the sticky bar in index.html). Script is at end-of-body
// so DOM is already parsed when this executes.
function wireKitchenBulkBar() {
  const $ = id => document.getElementById(id);
  if ($("kbb-stock"))  $("kbb-stock").onclick  = () => applyBulkKitchen("stock");
  if ($("kbb-out"))    $("kbb-out").onclick    = () => applyBulkKitchen("out");
  if ($("kbb-buy"))    $("kbb-buy").onclick    = () => applyBulkKitchen("buy");
  if ($("kbb-clear"))  $("kbb-clear").onclick  = () => { kitchenSelected.clear(); renderKitchen(); };
  if ($("btn-kitchen-select-all-empty")) $("btn-kitchen-select-all-empty").onclick = () => {
    Store.state.items.filter(i => i.qty === 0).forEach(i => kitchenSelected.add(i.id));
    renderKitchen();
  };
}

// ===== GROCERY =====
function renderGrocery() {
  const root = document.getElementById("grocery-list"); root.innerHTML = "";
  const toBuy = Store.state.items.filter(i => i.needsBuy);
  if (!toBuy.length) { root.innerHTML = `<p class="hint">Nothing to buy. Your kitchen is well-stocked!</p>`; return; }
  const groups = {}; toBuy.forEach(it => { (groups[it.category] ||= []).push(it); });
  Object.entries(groups).forEach(([cat, items]) => {
    const div = document.createElement("div"); div.className = "category";
    div.innerHTML = `<h3><span class="cat-icon">${getCategoryIcon(cat)}</span>${cat} <span class="count">${items.length}</span></h3><div class="items"></div>`;
    const box = div.querySelector(".items");
    items.forEach(it => {
      const el = document.createElement("div"); el.className = "item";
      el.innerHTML = `<span class="item-icon">${getItemIcon(it.name)}</span>
        <span class="name">${it.name}</span>
        <input type="number" class="qty" value="${it.defaultQty}" min="0" step="${it.step}" />
        <span class="unit">${it.unit}</span><button class="btn xs primary">Bought</button>`;
      const buy = el.querySelector("button");
      const qty = el.querySelector(".qty");
      buy.onclick = () => { it.qty=parseFloat(qty.value)||it.defaultQty; it.needsBuy=false; Store.save(); renderGrocery(); };
      box.appendChild(el);
    });
    root.appendChild(div);
  });
}

// ===== PANTRY MATCHING =====
function pantry() { return new Set(Store.state.items.filter(i => i.qty > 0).map(i => i.name.toLowerCase())); }
function has(token, p) {
  const t = token.toLowerCase();
  if (STAPLE_INGREDIENTS.has(t)) return true; // staples assumed always available
  return p.has(t);
}
function pickAll(list, p)   { return list.filter(x => has(x, p)); }
function pickFirst(list, p) { return list.find(x => has(x, p)); }

// ===== MEAL ENGINE =====
function resolveCurry(p, vegOnly) {
  const curries = getCurries();
  const filtered = vegOnly ? curries.filter(c => !c.nonVeg) : curries;
  for (const cu of filtered) {
    if (!cu.needs.every(n => has(n, p))) continue;
    if (cu.minFrom) { const m = pickAll(cu.minFrom, p);
      if (m.length < cu.minCount) continue;
      return cu.render ? cu.render(m.map(cap)) : cu.name; }
    return cu.render ? cu.render([]) : cu.name;
  }
  return null;
}

function resolvePoriyal(p) {
  const v = pickFirst(PORIYAL_VEG, p);
  return v ? `${cap(v)} Poriyal` : null;
}
function resolveVepudu(p) {
  const v = pickFirst(VEPUDU_VEG, p);
  return v ? `${cap(v)} Vepudu` : null;
}
function resolvePalya(p) {
  const v = pickFirst(PALYA_VEG, p);
  return v ? `${cap(v)} Palya` : null;
}

function tryCook(meal, p, strict = true, vegOnly = false) {
  if (vegOnly && meal.nonVeg) return null;
  const missing = meal.base.filter(b => !has(b, p));
  if (strict && missing.length) return null;
  const ctx = { matched: [], missing: [...missing] };
  if (meal.minFrom) {
    ctx.matched = pickAll(meal.minFrom, p);
    if (ctx.matched.length < (meal.minCount||1)) {
      if (strict) return null;
      ctx.missing.push(`${(meal.minCount||1) - ctx.matched.length} more item(s)`);
    }
  }
  if (meal.withThoran) { const v = pickFirst(THORAN_VEG, p); ctx.thoran = v ? `${cap(v)} Thoran` : null; }
  if (meal.withPoriyal) { ctx.poriyal = resolvePoriyal(p); }
  if (meal.withVepudu)  { ctx.vepudu  = resolveVepudu(p); }
  if (meal.withPalya)   { ctx.palya   = resolvePalya(p); }
  if (meal.withCurry) {
    const c = resolveCurry(p, vegOnly);
    if (!c) { if (strict) return null; ctx.missing.push("curry ingredients"); }
    ctx.curry = c || "Curry";
  }
  const display = meal.render ? meal.render(ctx) : meal.name;
  return { name: meal.name, type: meal.type, display, simple: meal.simple, special: meal.special,
           missing: ctx.missing, nonVeg: meal.nonVeg, priority: meal.priority || 99 };
}

// Weight by priority: lower number → more weight. Picks one element at random.
function weightedPickByPriority(list) {
  if (!list.length) return null;
  const weights = list.map(c => Math.max(1, 6 - (c.priority || 5)));
  const total = weights.reduce((s,w) => s+w, 0);
  let r = Math.random() * total;
  for (let i = 0; i < list.length; i++) { r -= weights[i]; if (r <= 0) return list[i]; }
  return list[list.length - 1];
}

function pickMeal(slot, p, recent, bev, dateStr) {
  const rules = getMealRules();
  let pool = rules[slot];
  if (!pool) return null;
  const vegOnly = dateStr ? isVegOnly(dateStr) : false;
  if (slot === "tea") {
    pool = pool.filter(m => !m.beverage || m.beverage === "either" || bev === "either" || m.beverage === bev);
    pool = pool.filter(m => !m.blackFallback || !has("milk", p));
  }
  let cookable = pool.map(m => tryCook(m, p, true, vegOnly)).filter(Boolean).filter(c => !recent.includes(c.name));
  if (!cookable.length) cookable = pool.map(m => tryCook(m, p, true, vegOnly)).filter(Boolean);
  if (!cookable.length) {
    // Relax strict matching — include partial matches
    cookable = pool.map(m => {
      const c = tryCook(m, p, false, vegOnly); if (!c) return null;
      const total = m.base.length || 1;
      const have = total - m.base.filter(b => !has(b, p)).length;
      return (have / total) >= 0.5 ? c : null;
    }).filter(Boolean);
  }
  if (!cookable.length) return null;
  if (slot === "lunch") {
    const specials = cookable.filter(c => c.special);
    if (specials.length && Math.random() < 0.15) return weightedPickByPriority(specials);
  }
  const normal = cookable.filter(c => !c.special);
  const cand = normal.length ? normal : cookable;
  const simple = cand.filter(c => c.simple);
  const pool2 = (simple.length && Math.random() < 0.8) ? simple : cand;
  return weightedPickByPriority(pool2);
}

function allCookable(slot, p, bev, dateStr) {
  const rules = getMealRules();
  let pool = rules[slot];
  if (!pool) return [];
  const vegOnly = dateStr ? isVegOnly(dateStr) : false;
  if (slot === "tea") pool = pool.filter(m => !m.beverage || m.beverage === "either" || bev === "either" || m.beverage === bev);
  return pool.map(m => tryCook(m, p, false, vegOnly)).filter(Boolean).map(c => ({
    ...c, fullyCookable: c.missing.length === 0
  })).sort((a,b) => {
    if (a.missing.length !== b.missing.length) return a.missing.length - b.missing.length;
    return (a.priority||99) - (b.priority||99); // priority 1 surfaces first
  });
}

function generatePlan(startDate, days = 7) {
  const p = pantry(), bev = Store.state.settings.beverage, plan = [];
  const recent = { breakfast:[], lunch:[], tea:[], dinner:[] };
  const allMissing = new Set();
  for (let i = 0; i < days; i++) {
    const d = new Date(startDate); d.setDate(d.getDate()+i);
    const key = ymdLocal(d); const meals = {};
    for (const slot of ["breakfast","lunch","tea","dinner"]) {
      const pick = pickMeal(slot, p, recent[slot].slice(-2), bev, key);
      if (pick) {
        meals[slot] = { name: pick.name, display: pick.display, missing: pick.missing };
        if (pick) recent[slot].push(pick.name);
        pick.missing.forEach(m => allMissing.add(m));
      } else {
        // Show best partial match instead of empty
        const partials = allCookable(slot, p, bev, key);
        if (partials.length) {
          meals[slot] = { name: partials[0].name, display: partials[0].display + " ⚠", missing: partials[0].missing };
          partials[0].missing.forEach(m => allMissing.add(m));
        } else {
          meals[slot] = { name: null, display: "No suggestion — stock basics", missing: [] };
        }
      }
    }
    Store.state.plans[key] = meals; plan.push({ date: key, meals });
  }
  Store.save(); return plan;
}

// ===== MEALS TAB =====
let editMode = false;

function renderMealsTab() {
  document.getElementById("bev-select").value = Store.state.settings.beverage;
  document.getElementById("meal-plan-title").textContent = `${getRegion()} Meal Plan`;
  const bannerEl = document.getElementById("template-banner");
  const tpl = Store.state.template;
  const thisWeek = isoWeek(new Date());
  const hasPlanThisWeek = Object.keys(Store.state.plans).some(d => isoWeek(d) === thisWeek);
  if (tpl && !hasPlanThisWeek && Store.state.templateDismissedWeek !== thisWeek) {
    bannerEl.style.display = "block";
  } else bannerEl.style.display = "none";
  loadExistingPlan();
}

document.getElementById("bev-select").onchange = e => {
  Store.state.settings.beverage = e.target.value; Store.save();
};
document.getElementById("btn-edit-toggle").onclick = () => {
  editMode = !editMode;
  document.getElementById("btn-edit-toggle").textContent = editMode ? "Done" : "Edit Plan";
  loadExistingPlan();
};
document.getElementById("btn-generate").onclick = () => {
  renderPlan(generatePlan(document.getElementById("plan-start").value, 7));
};
document.getElementById("btn-save-template").onclick = () => {
  const start = document.getElementById("plan-start").value;
  const tpl = {};
  for (let i = 0; i < 7; i++) {
    const d = new Date(start); d.setDate(d.getDate()+i);
    const key = ymdLocal(d), dow = d.getDay();
    if (Store.state.plans[key]) tpl[dow] = Store.state.plans[key];
  }
  Store.state.template = tpl; Store.save();
  alert("Weekly template saved.");
};
document.getElementById("btn-apply-template").onclick = () => {
  const tpl = Store.state.template; if (!tpl) return;
  const start = document.getElementById("plan-start").value;
  const p = pantry(), bev = Store.state.settings.beverage;
  const rules = getMealRules();
  const substitutions = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(start); d.setDate(d.getDate()+i);
    const key = ymdLocal(d), dow = d.getDay();
    const saved = tpl[dow]; if (!saved) continue;
    const meals = {};
    for (const slot of ["breakfast","lunch","tea","dinner"]) {
      const want = saved[slot]; if (!want) continue;
      const rule = rules[slot].find(m => m.name === want.name);
      const cooked = rule ? tryCook(rule, p, true) : null;
      if (cooked) meals[slot] = { name: cooked.name, display: cooked.display, missing: [] };
      else {
        const options = allCookable(slot, p, bev, key).filter(c => c.fullyCookable);
        const sameType = options.find(o => rule && o.type === rule.type);
        const sub = sameType || options[0];
        if (sub) { meals[slot] = { name: sub.name, display: sub.display + " ↺", missing: [] };
          substitutions.push(`${new Date(key).toLocaleDateString(undefined,{weekday:"short"})} ${slot}: ${want.name} → ${sub.name}`); }
        else meals[slot] = { name: null, display: want.name + " (missing)", missing: ["ingredients"] };
      }
    }
    Store.state.plans[key] = meals;
  }
  Store.state.templateDismissedWeek = isoWeek(new Date());
  Store.save();
  if (substitutions.length) alert("Applied with substitutions:\n\n" + substitutions.join("\n"));
  renderMealsTab();
};
document.getElementById("btn-dismiss-template").onclick = () => {
  Store.state.templateDismissedWeek = isoWeek(new Date()); Store.save(); renderMealsTab();
};

function loadExistingPlan() {
  const start = document.getElementById("plan-start").value;
  const plan = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(start); d.setDate(d.getDate()+i);
    const key = ymdLocal(d);
    if (Store.state.plans[key]) plan.push({ date: key, meals: Store.state.plans[key] });
  }
  if (plan.length) renderPlan(plan);
  else { document.getElementById("plan-grid").innerHTML = ""; document.getElementById("missing-panel").style.display = "none"; }
}

function renderPlan(plan) {
  const grid = document.getElementById("plan-grid"); grid.innerHTML = "";
  const p = pantry(), bev = Store.state.settings.beverage;
  const region = getRegion();
  const missingSet = new Set();
  plan.forEach(d => {
    const dayDate = d.date;
    const activeFest = FESTIVAL_DATA.find(f => f.states.includes(region) && f.start <= dayDate && f.end >= dayDate);
    const specialDay = getSpecialDay(dayDate);
    const vegOnly = isVegOnly(dayDate);

    const card = document.createElement("div");
    card.className = "day-card" + (activeFest ? " festival-day" : "") + (specialDay ? " special-day" : "") + (vegOnly ? " veg-day" : "");
    const label = new Date(d.date).toLocaleDateString(undefined,{weekday:"short",month:"short",day:"numeric"});
    let html = "";
    if (activeFest) html += `<div class="fest-badge">${activeFest.name}</div>`;
    if (specialDay) html += `<div class="special-badge">🎂 ${specialDay.title}</div>`;
    if (vegOnly) html += `<div class="veg-badge-small">🌿 Veg</div>`;
    html += `<h4>${label}</h4>`;
    for (const [slot, icon] of [["breakfast","🌅"],["lunch","🍛"],["tea","☕"],["dinner","🌙"]]) {
      const m = d.meals[slot] || {};
      (m.missing||[]).forEach(x => {
        const tok = x.toLowerCase();
        if (tok.includes(" ")) return;
        const item = Store.state.items.find(i => i.name.toLowerCase() === tok);
        if (item && !item.needsBuy && item.qty === 0) missingSet.add(item.id);
      });
      if (editMode) {
        const opts = allCookable(slot, p, bev, dayDate);
        const sel = opts.map(o => `<option value="${o.name}" ${m.name===o.name?"selected":""}>${getMealIcon(o.name)} ${o.display}${o.fullyCookable?"":" ⚠"}</option>`).join("");
        html += `<div class="meal-row"><b>${icon} ${slot}</b>
          <select data-date="${d.date}" data-slot="${slot}">${sel || `<option>—</option>`}</select></div>`;
      } else {
        const miss = (m.missing||[]).length ? `<span class="miss">needs: ${m.missing.join(", ")}</span>` : "";
        const dishIcon = m.name ? `<span class="meal-emoji">${getMealIcon(m.name)}</span>` : "";
        html += `<div class="meal-row${m.missing?.length?" partial":""}"><b>${icon} ${slot}</b>${dishIcon}${m.display || "—"}${miss}</div>`;
      }
    }
    card.innerHTML = html; grid.appendChild(card);
  });
  if (editMode) grid.querySelectorAll("select").forEach(s => {
    s.onchange = () => {
      const rules = getMealRules();
      const rule = rules[s.dataset.slot].find(r => r.name === s.value);
      const cooked = rule ? tryCook(rule, p, false) : null;
      if (cooked) Store.state.plans[s.dataset.date][s.dataset.slot] = { name: cooked.name, display: cooked.display, missing: cooked.missing };
      Store.save();
    };
  });
  renderMissingPanel(missingSet);
  document.getElementById("btn-save-template").style.display = plan.length ? "inline-block" : "none";
}

function renderMissingPanel(idSet) {
  const panel = document.getElementById("missing-panel");
  const list = document.getElementById("missing-list");
  if (!idSet.size) { panel.style.display = "none"; return; }
  panel.style.display = "block"; list.innerHTML = "";
  [...idSet].forEach(id => {
    const it = Store.state.items.find(i => i.id === id); if (!it) return;
    const chip = document.createElement("span"); chip.className = "chip";
    chip.innerHTML = `${it.name} <button title="Approve">✓</button><button title="Dismiss">✗</button>`;
    const [ok, no] = chip.querySelectorAll("button");
    ok.onclick = () => { it.needsBuy = true; Store.save(); chip.remove(); if (!list.children.length) panel.style.display = "none"; };
    no.onclick = () => { chip.remove(); if (!list.children.length) panel.style.display = "none"; };
    list.appendChild(chip);
  });
}
document.getElementById("btn-approve-all").onclick = () => {
  document.querySelectorAll("#missing-list .chip button[title=Approve]").forEach(b => b.click());
};

document.getElementById("plan-start").value = todayKey();

// ===== FESTIVALS & SPECIAL DAYS PANEL =====
function renderFestivalsPanel() {
  const region = getRegion();
  const list = document.getElementById("festival-list");
  if (!list) return;
  list.innerHTML = "";
  const today = todayKey();

  // Festivals
  const festivals = FestivalService.getAllForRegion(region);
  if (festivals.length) {
    const h = document.createElement("h3"); h.textContent = "Festivals"; list.appendChild(h);
    festivals.forEach(f => {
      const isActive = f.start <= today && f.end >= today;
      const isPast = f.end < today;
      const card = document.createElement("div");
      card.className = "fest-card" + (isActive ? " active" : "") + (isPast ? " past" : "");
      const badge = isActive ? `<span class="badge live">Live</span>` :
                    isPast ? `<span class="badge past">Past</span>` :
                    `<span class="badge soon">Upcoming</span>`;
      card.innerHTML = `
        <div class="fest-card-head"><h4>${f.name}</h4>${badge}</div>
        <div class="fest-card-meta">${fmtDate(f.start)}${f.start !== f.end ? " — " + fmtDate(f.end) : ""}</div>
        ${isActive ? `<div class="fest-card-greeting">${f.greeting}</div>` : ""}`;
      list.appendChild(card);
    });
  }

  // Special Days
  const sds = Store.state.specialDays || [];
  const sdHeader = document.createElement("div");
  sdHeader.className = "sd-header";
  sdHeader.innerHTML = `<h3>Special Days</h3><button class="btn xs primary" id="btn-add-special-day">+ Add</button>`;
  list.appendChild(sdHeader);

  if (sds.length) {
    sds.sort((a,b) => a.date.localeCompare(b.date)).forEach(sd => {
      const isPast = sd.date < today && !sd.recurring;
      const card = document.createElement("div");
      card.className = "fest-card special" + (isPast ? " past" : "");
      card.innerHTML = `
        <div class="fest-card-head">
          <h4>🎂 ${sd.title}</h4>
          ${sd.recurring ? `<span class="badge recur">Every year</span>` : `<span class="badge soon">${fmtDate(sd.date)}</span>`}
        </div>
        <div class="fest-card-meta">${sd.type || "Custom"}${sd.meals ? " · Custom meals set" : ""}</div>
        <button class="btn xs sd-del" data-id="${sd.id}" style="margin-top:6px;color:var(--red)">Delete</button>`;
      card.querySelector(".sd-del").onclick = () => {
        Store.state.specialDays = Store.state.specialDays.filter(x => x.id !== sd.id);
        Store.save(); renderFestivalsPanel();
      };
      list.appendChild(card);
    });
  } else {
    list.appendChild(Object.assign(document.createElement("p"), { className:"hint", textContent:"No special days added yet." }));
  }

  document.getElementById("btn-add-special-day").onclick = showAddSpecialDayDialog;

  // Veg Restrictions
  renderVegRestrictions(list);
}

function showAddSpecialDayDialog() {
  const overlay = document.createElement("div"); overlay.className = "dialog-overlay";
  overlay.innerHTML = `<div class="dialog">
    <h3>Add Special Day</h3>
    <label>Title <input id="sd-title" placeholder="e.g. Mom's Birthday" /></label>
    <label>Date <input id="sd-date" type="date" /></label>
    <label>Type <select id="sd-type">
      <option value="Birthday">Birthday</option><option value="Anniversary">Anniversary</option>
      <option value="Custom">Custom</option></select></label>
    <label class="switch"><input type="checkbox" id="sd-recurring" checked /> Repeats every year</label>
    <label>Special meal (optional) <input id="sd-meal" placeholder="e.g. Biriyani, Payasam" /></label>
    <div class="dialog-actions">
      <button class="btn" id="sd-cancel">Cancel</button>
      <button class="btn primary" id="sd-save">Save</button>
    </div>
  </div>`;
  document.body.appendChild(overlay);
  document.getElementById("sd-cancel").onclick = () => overlay.remove();
  document.getElementById("sd-save").onclick = () => {
    const title = document.getElementById("sd-title").value.trim();
    const date = document.getElementById("sd-date").value;
    if (!title || !date) { alert("Title and date are required."); return; }
    const type = document.getElementById("sd-type").value;
    const recurring = document.getElementById("sd-recurring").checked;
    const mealStr = document.getElementById("sd-meal").value.trim();
    const meals = mealStr ? { lunch: mealStr } : null;
    Store.state.specialDays.push({ id: uid(), date, title, type, recurring, meals });
    Store.save(); overlay.remove(); renderFestivalsPanel();
  };
}

function renderVegRestrictions(container) {
  const vr = Store.state.vegRestrictions;
  const section = document.createElement("div"); section.className = "veg-restrictions-section";
  const dayNames = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
  section.innerHTML = `<h3>Veg-Only Rules</h3>
    <p class="hint">Non-veg meals are excluded on veg-only days or months.</p>
    <div class="veg-days">
      <label>Veg days of the week:</label>
      <div class="veg-day-chips">${dayNames.map((d,i) =>
        `<button class="chip-btn${vr.days.includes(i)?" active":""}" data-day="${i}">${d}</button>`
      ).join("")}</div>
    </div>
    <div class="veg-month-row">
      <label>Veg-only month: <input type="month" id="veg-month-input" /></label>
      <button class="btn xs primary" id="btn-add-veg-month">Add</button>
    </div>
    ${vr.months.length ? `<div class="veg-months-list">${vr.months.map(m =>
      `<span class="chip">${m} <button class="vm-del" data-month="${m}">✗</button></span>`
    ).join("")}</div>` : ""}`;

  container.appendChild(section);

  section.querySelectorAll(".chip-btn").forEach(btn => {
    btn.onclick = () => {
      const day = parseInt(btn.dataset.day);
      const idx = vr.days.indexOf(day);
      if (idx === -1) vr.days.push(day); else vr.days.splice(idx, 1);
      Store.save(); renderFestivalsPanel();
    };
  });
  const addMonthBtn = section.querySelector("#btn-add-veg-month");
  if (addMonthBtn) addMonthBtn.onclick = () => {
    const val = document.getElementById("veg-month-input").value;
    if (val && !vr.months.includes(val)) { vr.months.push(val); Store.save(); renderFestivalsPanel(); }
  };
  section.querySelectorAll(".vm-del").forEach(btn => {
    btn.onclick = () => {
      vr.months = vr.months.filter(m => m !== btn.dataset.month);
      Store.save(); renderFestivalsPanel();
    };
  });
}

// ===== REMINDERS =====
function renderReminders() {
  const root = document.getElementById("reminder-list"); root.innerHTML = "";
  Store.state.reminders.forEach(r => {
    const el = document.createElement("div"); el.className = "rem" + (r.active?"":" off");
    el.innerHTML = `<div><b>${r.title}</b><div class="meta">${r.frequency}${r.time?" · "+r.time:""}</div></div>
      <div class="actions"><button class="btn">${r.active?"Pause":"Resume"}</button>
      <button class="btn" style="color:#c0392b">Delete</button></div>`;
    const [tg, dl] = el.querySelectorAll("button");
    tg.onclick = () => { r.active = !r.active; Store.save(); renderReminders(); };
    dl.onclick = () => { Store.state.reminders = Store.state.reminders.filter(x=>x.id!==r.id); Store.save(); renderReminders(); };
    root.appendChild(el);
  });
}
document.getElementById("btn-add-rem").onclick = () => {
  const title = document.getElementById("r-title").value.trim(); if (!title) return;
  Store.state.reminders.push({ id: uid(), title,
    frequency: document.getElementById("r-freq").value,
    time: document.getElementById("r-time").value || null, active: true });
  Store.save(); document.getElementById("r-title").value = ""; renderReminders();
};
document.getElementById("btn-enable-notif").onclick = async () => {
  if (!("Notification" in window)) return alert("Not supported.");
  const res = await Notification.requestPermission();
  alert(res === "granted" ? "Enabled" : "Permission: " + res);
};

// ===== MEAL REMINDERS UI =====
function initMealRemindersUI() {
  const mr = Store.state.mealReminders;
  const fn = Store.state.festivalNotifs;
  const wr = Store.state.waterReminder;
  const $ = id => document.getElementById(id);
  if (!$("mr-enabled")) return;
  $("mr-enabled").checked = !!mr.enabled;
  $("mr-breakfast").value = mr.breakfast || "";
  $("mr-lunch").value = mr.lunch || "";
  $("mr-tea").value = mr.tea || "";
  $("mr-dinner").value = mr.dinner || "";
  $("fn-enabled").checked = !!fn.enabled;
  $("fn-time").value = fn.morningTime || "08:00";
  $("fn-lead").value = fn.leadDays || 1;
  // Water reminder
  if ($("wr-enabled")) {
    $("wr-enabled").checked = !!wr.enabled;
    $("wr-interval").value = wr.intervalMinutes || 60;
    $("wr-start").value = wr.startTime || "08:00";
    $("wr-end").value = wr.endTime || "22:00";
    $("wr-goal").value = wr.glassesGoal || 8;
    refreshWaterCount();
  }

  $("btn-save-meal-rem").onclick = () => {
    Store.state.mealReminders = {
      enabled: $("mr-enabled").checked,
      breakfast: $("mr-breakfast").value || null,
      lunch: $("mr-lunch").value || null,
      tea: $("mr-tea").value || null,
      dinner: $("mr-dinner").value || null,
    };
    Store.save();
    alert("Meal reminders saved.");
  };
  $("btn-save-fest-notif").onclick = () => {
    Store.state.festivalNotifs = {
      enabled: $("fn-enabled").checked,
      morningTime: $("fn-time").value || "08:00",
      leadDays: Math.max(1, Math.min(14, parseInt($("fn-lead").value,10) || 1)),
    };
    Store.save();
    alert("Festival notifications saved.");
  };
  $("mr-enabled").onchange = () => { Store.state.mealReminders.enabled = $("mr-enabled").checked; Store.save(); };
  $("fn-enabled").onchange = () => { Store.state.festivalNotifs.enabled = $("fn-enabled").checked; Store.save(); };

  // Water reminder wiring
  if ($("wr-enabled")) {
    $("wr-enabled").onchange = () => {
      Store.state.waterReminder.enabled = $("wr-enabled").checked;
      Store.save();
    };
    $("btn-save-water").onclick = () => {
      const interval = Math.max(15, Math.min(240, parseInt($("wr-interval").value, 10) || 60));
      Store.state.waterReminder = {
        enabled: $("wr-enabled").checked,
        intervalMinutes: interval,
        startTime: $("wr-start").value || "08:00",
        endTime: $("wr-end").value || "22:00",
        glassesGoal: Math.max(1, Math.min(20, parseInt($("wr-goal").value, 10) || 8)),
      };
      Store.save();
      alert("Water reminder saved.");
    };
    if ($("btn-water-drank")) $("btn-water-drank").onclick = () => {
      const k = todayKey();
      Store.state.waterLog[k] = (Store.state.waterLog[k] || 0) + 1;
      Store.save();
      refreshWaterCount();
    };
    if ($("btn-water-reset")) $("btn-water-reset").onclick = () => {
      delete Store.state.waterLog[todayKey()];
      Store.save();
      refreshWaterCount();
    };
  }
}

function refreshWaterCount() {
  const el = document.getElementById("water-count-display");
  if (!el) return;
  const goal = Store.state.waterReminder.glassesGoal || 8;
  const count = Store.state.waterLog[todayKey()] || 0;
  el.textContent = `${count} / ${goal} glasses today`;
  el.className = "water-count-display" + (count >= goal ? " goal-met" : "");
}

// ===== REMINDER SUB-TABS =====
document.querySelectorAll(".rem-tab").forEach(t => {
  t.onclick = () => {
    document.querySelectorAll(".rem-tab").forEach(x => x.classList.remove("active"));
    document.querySelectorAll(".rem-panel").forEach(x => x.classList.remove("active"));
    t.classList.add("active");
    document.getElementById(t.dataset.remtab).classList.add("active");
  };
});

// ===== TRACKER =====
let trackerMonth = monthKey();

function renderTracker() { renderTrackerMonth(); }

function renderTrackerMonth() {
  const [yr, mo] = trackerMonth.split("-").map(Number);
  const daysInMonth = new Date(yr, mo, 0).getDate();
  const today = todayKey();

  document.getElementById("tracker-month-label").textContent =
    new Date(yr, mo-1, 1).toLocaleDateString("en-IN",{month:"long",year:"numeric"});

  const maid = Store.state.tracker.maid;
  const milk = Store.state.tracker.milk;
  const newspaper = Store.state.tracker.newspaper;

  let maidPresent=0, maidAbsent=0, milkReceived=0, milkMissed=0, newsReceived=0, newsMissed=0;
  for (let d = 1; d <= daysInMonth; d++) {
    const k = `${trackerMonth}-${String(d).padStart(2,"0")}`;
    if (maid[k] === "present") maidPresent++;
    if (maid[k] === "absent")  maidAbsent++;
    if (milk[k] === "received") milkReceived++;
    if (milk[k] === "missed")   milkMissed++;
    if (newspaper[k] === "received") newsReceived++;
    if (newspaper[k] === "missed")   newsMissed++;
  }
  document.getElementById("stat-maid-present").textContent = maidPresent;
  document.getElementById("stat-maid-absent").textContent  = maidAbsent;
  document.getElementById("stat-milk-received").textContent = milkReceived;
  document.getElementById("stat-milk-missed").textContent   = milkMissed;
  document.getElementById("stat-news-received").textContent = newsReceived;
  document.getElementById("stat-news-missed").textContent   = newsMissed;

  const grid = document.getElementById("tracker-grid");
  grid.innerHTML = "";
  ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].forEach(d => {
    const h = document.createElement("div");
    h.className = "cal-header"; h.textContent = d; grid.appendChild(h);
  });
  const firstDow = new Date(yr, mo-1, 1).getDay();
  for (let i = 0; i < firstDow; i++) {
    const blank = document.createElement("div"); blank.className = "cal-cell blank"; grid.appendChild(blank);
  }
  for (let d = 1; d <= daysInMonth; d++) {
    const k = `${trackerMonth}-${String(d).padStart(2,"0")}`;
    const isToday = k === today;
    const isFuture = k > today;
    const cell = document.createElement("div");
    cell.className = "cal-cell" + (isToday?" today":"") + (isFuture?" future":"");

    const maidVal = maid[k] || "";
    const milkVal = milk[k] || "";
    const newsVal = newspaper[k] || "";

    cell.innerHTML = `
      <div class="cal-day">${d}</div>
      <div class="cal-badges">
        <button class="badge maid-badge ${maidVal}" data-key="${k}" data-type="maid" title="Toggle maid">
          ${maidVal === "present" ? "✓M" : maidVal === "absent" ? "✗M" : "·M"}
        </button>
        <button class="badge milk-badge ${milkVal}" data-key="${k}" data-type="milk" title="Toggle milk">
          ${milkVal === "received" ? "✓🥛" : milkVal === "missed" ? "✗🥛" : "·🥛"}
        </button>
        <button class="badge news-badge ${newsVal}" data-key="${k}" data-type="newspaper" title="Toggle newspaper">
          ${newsVal === "received" ? "✓📰" : newsVal === "missed" ? "✗📰" : "·📰"}
        </button>
      </div>`;

    if (!isFuture) {
      cell.querySelectorAll(".badge").forEach(btn => {
        btn.onclick = () => {
          const type = btn.dataset.type;
          const key = btn.dataset.key;
          const tracker = Store.state.tracker[type];
          if (type === "maid") {
            const cur = tracker[key] || "";
            tracker[key] = cur === "" ? "present" : cur === "present" ? "absent" : "";
          } else {
            const cur = tracker[key] || "";
            tracker[key] = cur === "" ? "received" : cur === "received" ? "missed" : "";
          }
          if (tracker[key] === "") delete tracker[key];
          Store.save(); renderTrackerMonth();
        };
      });
    }
    grid.appendChild(cell);
  }
}

document.getElementById("tracker-prev").onclick = () => {
  const [yr, mo] = trackerMonth.split("-").map(Number);
  // Walk back one month without going through Date->ISO (which shifts to UTC and breaks IST).
  const newMo = mo === 1 ? 12 : mo - 1;
  const newYr = mo === 1 ? yr - 1 : yr;
  trackerMonth = `${newYr}-${pad2(newMo)}`;
  renderTrackerMonth();
};
document.getElementById("tracker-next").onclick = () => {
  const [yr, mo] = trackerMonth.split("-").map(Number);
  const newMo = mo === 12 ? 1 : mo + 1;
  const newYr = mo === 12 ? yr + 1 : yr;
  trackerMonth = `${newYr}-${pad2(newMo)}`;
  renderTrackerMonth();
};

// ===== REGION SELECTOR =====
function initRegionSelector() {
  const sel = document.getElementById("region-select");
  if (!sel) return;
  sel.value = getRegion();
  sel.onchange = () => {
    Store.state.settings.region = sel.value;
    Store.save();
    if (document.getElementById("meal-plan-title"))
      document.getElementById("meal-plan-title").textContent = `${sel.value} Meal Plan`;
    renderToday();
    renderFestivalBanner();
  };
}

// ===== FESTIVAL MODE SELECTOR =====
function initFestivalMode() {
  const sel = document.getElementById("festival-mode-select");
  if (!sel) return;
  sel.value = Store.state.settings.festivalMode;
  sel.onchange = () => {
    Store.state.settings.festivalMode = sel.value;
    Store.save();
    renderToday();
  };
}

// ===== NOTIFICATION CHECK =====
function fireNotif(title, body, tag) {
  try {
    if (navigator.serviceWorker && navigator.serviceWorker.ready) {
      navigator.serviceWorker.ready.then(reg => {
        reg.showNotification(title, { body, icon: "assets/logo.png", badge: "assets/logo.png", tag });
      }).catch(() => new Notification(title, { body, icon: "assets/logo.png", tag }));
    } else {
      new Notification(title, { body, icon: "assets/logo.png", tag });
    }
  } catch { try { new Notification(title, { body, icon: "assets/logo.png" }); } catch {} }
}

function mealTextFor(slot, dateKey) {
  const region = getRegion();
  const active = FestivalService.getActive(region);
  const festMode = Store.state.settings.festivalMode;
  const festMeals = active ? FestivalService.getTodaysMeals(active) : null;
  if (festMeals && festMeals[slot] && festMode === "override") {
    return Array.isArray(festMeals[slot]) ? festMeals[slot].join(", ") : festMeals[slot];
  }
  const special = getSpecialDay(dateKey);
  if (special && special.meals && special.meals[slot]) return special.meals[slot];
  const saved = Store.state.plans[dateKey];
  if (saved && saved[slot] && saved[slot].display) return saved[slot].display;
  if (saved && saved[slot] && saved[slot].name) return saved[slot].name;
  // Fallback: first cookable suggestion
  try {
    const p = pantry();
    const bev = Store.state.settings.beverage;
    const opts = allCookable(slot, p, bev, dateKey);
    if (opts && opts.length) return opts[0].display || opts[0].name;
  } catch {}
  return null;
}

function checkReminders() {
  if (!("Notification" in window) || Notification.permission !== "granted") return;
  const now = new Date(), today = now.toISOString().slice(0,10), hhmm = now.toTimeString().slice(0,5);
  Store.state.notifiedDates ||= {};

  // --- Custom user reminders ---
  Store.state.reminders.forEach(r => {
    if (!r.active || !r.time || r.time !== hhmm) return;
    if (r.frequency === "weekly" && now.getDay() !== 1) return;
    const stamp = today + "-" + hhmm;
    if (Store.state.notifiedDates[r.id] === stamp) return;
    fireNotif("Pachaka Lokam", r.title, "rem-" + r.id);
    Store.state.notifiedDates[r.id] = stamp; Store.save();
  });

  // --- Meal reminders ---
  const mr = Store.state.mealReminders;
  if (mr && mr.enabled) {
    ["breakfast","lunch","tea","dinner"].forEach(slot => {
      if (mr[slot] !== hhmm) return;
      const key = "meal-" + slot + "-" + today;
      if (Store.state.notifiedDates[key]) return;
      const meal = mealTextFor(slot, today);
      const labelMap = { breakfast:"🌅 Breakfast", lunch:"🍛 Lunch", tea:"☕ Evening Tea", dinner:"🌙 Dinner" };
      const body = meal ? `${labelMap[slot]}: ${meal}` : `${labelMap[slot]} time — plan your meal`;
      fireNotif("Pachaka Lokam", body, key);
      Store.state.notifiedDates[key] = 1; Store.save();
    });
  }

  // --- Water reminders ---
  // Fires at every interval slot between startTime and endTime. One notification per slot
  // per day, deduped via notifiedDates so reopening the app doesn't refire.
  const wr = Store.state.waterReminder;
  if (wr && wr.enabled) {
    const [sH, sM] = (wr.startTime || "08:00").split(":").map(Number);
    const [eH, eM] = (wr.endTime   || "22:00").split(":").map(Number);
    const nowMin = now.getHours()*60 + now.getMinutes();
    const startMin = sH*60 + sM, endMin = eH*60 + eM;
    if (nowMin >= startMin && nowMin <= endMin) {
      const interval = Math.max(15, wr.intervalMinutes || 60);
      const slot = Math.floor((nowMin - startMin) / interval);
      const slotMin = startMin + slot * interval;
      // Fire only within the first 2 minutes of the slot (so we don't miss it if the timer ticks late).
      if (nowMin - slotMin <= 2) {
        const wkey = `water-${today}-${slot}`;
        if (!Store.state.notifiedDates[wkey]) {
          const drank = Store.state.waterLog[today] || 0;
          const goal = wr.glassesGoal || 8;
          fireNotif("💧 Water Reminder",
            `Time for a glass of water! (${drank}/${goal} today)`, wkey);
          Store.state.notifiedDates[wkey] = 1;
          Store.save();
        }
      }
    }
  }

  // --- Festival notifications ---
  const fn = Store.state.festivalNotifs;
  if (fn && fn.enabled && fn.morningTime === hhmm) {
    const region = getRegion();
    const active = FestivalService.getActive(region);
    if (active) {
      const dayIdx = FestivalService.getDayIndex(active);
      const isStart = active.start === today;
      const isPeak = FestivalService.isPeakDay(active);
      const key = "fest-" + active.name + "-" + today;
      if (!Store.state.notifiedDates[key]) {
        let body;
        if (isStart) body = `${active.greeting} — ${active.name} starts today!`;
        else if (isPeak) body = `${active.greeting} — Today is the peak of ${active.name}!`;
        else body = `${active.name} — Day ${dayIdx+1} in progress`;
        fireNotif("🎊 Festival", body, key);
        Store.state.notifiedDates[key] = 1; Store.save();
      }
    } else {
      const next = FestivalService.getNext(region);
      if (next) {
        const daysUntil = Math.floor((new Date(next.start) - new Date(today)) / 86400000);
        if (daysUntil > 0 && daysUntil <= (fn.leadDays || 1)) {
          const key = "fest-up-" + next.name + "-" + today;
          if (!Store.state.notifiedDates[key]) {
            fireNotif("🎊 Upcoming Festival",
              `${next.name} in ${daysUntil} day${daysUntil===1?"":"s"} — prep your list!`, key);
            Store.state.notifiedDates[key] = 1; Store.save();
          }
        }
      }
    }
  }
}
setInterval(checkReminders, 30*1000);
// Run once on load (in case user opens app at reminder time)
setTimeout(checkReminders, 2000);

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("sw.js").then(reg => {
    // When a new SW takes over, refresh once so users get the latest shell.
    if (reg && reg.waiting) reg.waiting.postMessage("SKIP_WAITING");
    reg && reg.addEventListener && reg.addEventListener("updatefound", () => {
      const sw = reg.installing;
      if (!sw) return;
      sw.addEventListener("statechange", () => {
        if (sw.state === "installed" && navigator.serviceWorker.controller) {
          // New version ready — silent swap on next reload
          sw.postMessage && sw.postMessage("SKIP_WAITING");
        }
      });
    });
  }).catch(() => {});
}

// ===== ONLINE/OFFLINE BANNER =====
function updateNetworkBanner() {
  let bar = document.getElementById("pl-net-banner");
  if (!navigator.onLine) {
    if (!bar) {
      bar = document.createElement("div");
      bar.id = "pl-net-banner";
      bar.textContent = "📴 Offline — your data stays on this device";
      bar.style.cssText = "position:sticky;top:0;z-index:50;background:#444;color:#fff;text-align:center;padding:6px;font-size:13px;font-weight:600";
      document.body.prepend(bar);
    }
  } else if (bar) { bar.remove(); }
}
window.addEventListener("online", updateNetworkBanner);
window.addEventListener("offline", updateNetworkBanner);

// ===== GLOBAL ERROR GUARDS =====
// One bad render must never break a tab. Log & let user keep using the app.
window.addEventListener("error", e => {
  console.error("[PL] runtime error:", e.error || e.message);
});
window.addEventListener("unhandledrejection", e => {
  console.error("[PL] unhandled promise:", e.reason);
});

// Wrap every render* function so a thrown error in one tab can't kill the app.
function _safeWrap(name) {
  const fn = window[name];
  if (typeof fn !== "function") return;
  window[name] = function safe(...args) {
    try { return fn.apply(this, args); }
    catch (err) {
      console.error(`[PL] ${name} failed:`, err);
      // Best-effort inline error so a tab is never blank
      try {
        const idMap = {
          renderToday: "today", renderKitchen: "kitchen", renderGrocery: "grocery",
          renderMealsTab: "meals", renderReminders: "reminder-list",
          renderTracker: "rem-tracker", renderFestivalsPanel: "festivals",
          renderFestivalBanner: "festival-banner",
        };
        const target = document.getElementById(idMap[name]);
        if (target && !target.dataset.plErrored) {
          target.dataset.plErrored = "1";
          const note = document.createElement("div");
          note.style.cssText = "padding:12px;margin:10px;background:#fff3cd;border:1px solid #ffe08a;border-radius:8px;color:#7a5b00;font-size:13px";
          note.innerHTML = `⚠ Couldn't render this section. Your data is safe — try switching tabs and back. <button class="btn xs" onclick="location.reload()">Reload</button>`;
          target.appendChild(note);
        }
      } catch {}
      return null;
    }
  };
}
[
  "renderToday","renderKitchen","renderGrocery","renderMealsTab",
  "renderReminders","renderTracker","renderTrackerMonth",
  "renderFestivalsPanel","renderFestivalBanner","renderGasCylinderWidget",
  "initMealRemindersUI","initRegionSelector","initFestivalMode",
].forEach(_safeWrap);

// ===== SPLASH DISMISSAL =====
function dismissSplash() {
  document.body.classList.add("pl-ready");
  setTimeout(() => {
    const s = document.getElementById("pl-splash");
    if (s) s.remove();
    const ss = document.getElementById("pl-splash-style");
    if (ss) ss.remove();
  }, 450);
}

// ===== INIT =====
(function bootstrap() {
  try { Store.load(); }
  catch (err) {
    console.error("[PL] Store.load failed, recovering with defaults:", err);
    try { localStorage.removeItem(STORAGE_KEY); Store.load(); } catch {}
  }
  // Each step is independent — failure in one won't stop the others.
  const steps = [
    initRegionSelector, initFestivalMode, initMealRemindersUI, wireKitchenBulkBar,
    renderFestivalBanner, renderToday, renderKitchen,
    renderReminders, renderMealsTab, activateTabFromQuery,
    updateNetworkBanner,
  ];
  steps.forEach(fn => {
    try { typeof fn === "function" && fn(); }
    catch (err) { console.error("[PL] init step failed:", fn && fn.name, err); }
  });
  try { dismissSplash(); } catch {}
})();
// Belt-and-braces: dismiss splash after 4s no matter what
setTimeout(() => { try { dismissSplash(); } catch {} }, 4000);

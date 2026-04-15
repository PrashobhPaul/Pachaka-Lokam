/* Pachaka Lokam v2.0 — festivals, regions, special days, veg restrictions, buy-suggestions */
const STORAGE_KEY = "pl_state_v6";
const uid = () => Math.random().toString(36).slice(2, 10);
const cap = s => s[0].toUpperCase() + s.slice(1);
const isoWeek = d => { const x=new Date(d); x.setHours(0,0,0,0); x.setDate(x.getDate()+4-(x.getDay()||7));
  const y=new Date(x.getFullYear(),0,1); return `${x.getFullYear()}-W${String(Math.ceil(((x-y)/86400000+1)/7)).padStart(2,"0")}`; };
const todayKey = () => new Date().toISOString().slice(0,10);
const monthKey = () => new Date().toISOString().slice(0,7);
const fmtDate = d => new Date(d).toLocaleDateString("en-IN",{weekday:"short",day:"numeric",month:"short"});

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

// ===== TAB NAVIGATION =====
document.querySelectorAll(".tab").forEach(t => {
  t.onclick = () => {
    document.querySelectorAll(".tab").forEach(x => x.classList.remove("active"));
    document.querySelectorAll(".panel").forEach(x => x.classList.remove("active"));
    t.classList.add("active");
    document.getElementById(t.dataset.tab).classList.add("active");
    if (t.dataset.tab === "today") renderToday();
    if (t.dataset.tab === "grocery") renderGrocery();
    if (t.dataset.tab === "kitchen") renderKitchen();
    if (t.dataset.tab === "meals") renderMealsTab();
    if (t.dataset.tab === "reminders") { renderReminders(); renderTracker(); }
    if (t.dataset.tab === "festivals") renderFestivalsPanel();
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
        html += `<div class="fest-dish"><span>${slot}</span>${Array.isArray(items) ? items.join(", ") : items}</div>`;
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
      `<option value="${o.name}" ${o.name===current?"selected":""}>${o.display}${o.fullyCookable?"":" ⚠"}</option>`
    ).join("");
    // If no fully cookable options, show buy suggestions
    if (!options.some(o => o.fullyCookable) && options.length) {
      sel.innerHTML += `<option disabled>── buy ingredients for ──</option>`;
    }
    if (!options.length) sel.innerHTML = `<option>— nothing available —</option>`;

    const disp = card.querySelector(".today-meal-display");
    if (festOverride) {
      disp.textContent = Array.isArray(festMeals[id]) ? festMeals[id].join(", ") : festMeals[id];
      disp.className = "today-meal-display festival";
    } else if (saved_meal && saved_meal.display) {
      disp.textContent = saved_meal.display;
      disp.className = "today-meal-display set";
    } else if (options.length && options[0].fullyCookable) {
      disp.textContent = options[0].display;
      disp.className = "today-meal-display suggestion";
    } else if (options.length) {
      // Best partial match — show with buy prompt
      disp.textContent = options[0].display + " ⚠";
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
function renderKitchen() {
  const root = document.getElementById("kitchen-groups"); root.innerHTML = "";
  const groups = {};
  Store.state.items.forEach(it => { (groups[it.category] ||= []).push(it); });
  Object.entries(groups).forEach(([cat, items]) => {
    const stocked = items.filter(i => i.qty > 0), empty = items.filter(i => i.qty === 0);
    const div = document.createElement("div"); div.className = "category";
    div.innerHTML = `<h3>${cat} <span class="count">${stocked.length}/${items.length} stocked</span></h3>
      <div class="items stocked-grid"></div>
      ${empty.length ? `<details><summary>Not in kitchen (${empty.length})</summary><div class="items empty-grid"></div></details>` : ""}`;
    const sBox = div.querySelector(".stocked-grid"), eBox = div.querySelector(".empty-grid");
    stocked.forEach(it => {
      const el = document.createElement("div"); el.className = "item stocked";
      el.innerHTML = `<span class="name">${it.name}</span>
        <input type="number" class="qty" value="${it.qty}" min="0" step="${it.step}" />
        <span class="unit">${it.unit}</span><button class="btn xs">Out</button>`;
      const [, qty, , out] = el.children;
      qty.onchange = () => { const v=parseFloat(qty.value)||0; it.qty=v; if(v===0) it.needsBuy=true; Store.save(); renderKitchen(); };
      out.onclick = () => { it.qty=0; it.needsBuy=true; Store.save(); renderKitchen(); };
      sBox.appendChild(el);
    });
    if (eBox) empty.forEach(it => {
      const el = document.createElement("div"); el.className = "item empty";
      el.innerHTML = `<span class="name">${it.name}</span><span class="unit">${it.unit}</span>
        <button class="btn xs primary">Got it</button><button class="btn xs">+ Buy</button>`;
      const [, , got, buy] = el.children;
      got.onclick = () => { it.qty=it.defaultQty; it.needsBuy=false; Store.save(); renderKitchen(); };
      buy.onclick = () => { it.needsBuy=true; Store.save(); renderKitchen(); };
      eBox.appendChild(el);
    });
    root.appendChild(div);
  });
}
document.getElementById("btn-reset-month").onclick = () => {
  if (!confirm("Reset month?")) return;
  Store.state.items.forEach(it => { it.qty=0; it.needsBuy=true; });
  Store.save(); renderKitchen();
};

// ===== GROCERY =====
function renderGrocery() {
  const root = document.getElementById("grocery-list"); root.innerHTML = "";
  const toBuy = Store.state.items.filter(i => i.needsBuy);
  if (!toBuy.length) { root.innerHTML = `<p class="hint">Nothing to buy. Your kitchen is well-stocked!</p>`; return; }
  const groups = {}; toBuy.forEach(it => { (groups[it.category] ||= []).push(it); });
  Object.entries(groups).forEach(([cat, items]) => {
    const div = document.createElement("div"); div.className = "category";
    div.innerHTML = `<h3>${cat} <span class="count">${items.length}</span></h3><div class="items"></div>`;
    const box = div.querySelector(".items");
    items.forEach(it => {
      const el = document.createElement("div"); el.className = "item";
      el.innerHTML = `<span class="name">${it.name}</span>
        <input type="number" class="qty" value="${it.defaultQty}" min="0" step="${it.step}" />
        <span class="unit">${it.unit}</span><button class="btn xs primary">Bought</button>`;
      const [, qty, , buy] = el.children;
      buy.onclick = () => { it.qty=parseFloat(qty.value)||it.defaultQty; it.needsBuy=false; Store.save(); renderGrocery(); };
      box.appendChild(el);
    });
    root.appendChild(div);
  });
}

// ===== PANTRY MATCHING =====
function pantry() { return new Set(Store.state.items.filter(i => i.qty > 0).map(i => i.name.toLowerCase())); }
function has(token, p) { return p.has(token.toLowerCase()); }
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
  return { name: meal.name, type: meal.type, display, simple: meal.simple, special: meal.special, missing: ctx.missing, nonVeg: meal.nonVeg };
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
    if (specials.length && Math.random() < 0.15) return specials[Math.floor(Math.random()*specials.length)];
  }
  const normal = cookable.filter(c => !c.special);
  const cand = normal.length ? normal : cookable;
  const simple = cand.filter(c => c.simple);
  const pool2 = (simple.length && Math.random() < 0.8) ? simple : cand;
  return pool2[Math.floor(Math.random()*pool2.length)];
}

function allCookable(slot, p, bev, dateStr) {
  const rules = getMealRules();
  let pool = rules[slot];
  if (!pool) return [];
  const vegOnly = dateStr ? isVegOnly(dateStr) : false;
  if (slot === "tea") pool = pool.filter(m => !m.beverage || m.beverage === "either" || bev === "either" || m.beverage === bev);
  return pool.map(m => tryCook(m, p, false, vegOnly)).filter(Boolean).map(c => ({
    ...c, fullyCookable: c.missing.length === 0
  })).sort((a,b) => a.missing.length - b.missing.length);
}

function generatePlan(startDate, days = 7) {
  const p = pantry(), bev = Store.state.settings.beverage, plan = [];
  const recent = { breakfast:[], lunch:[], tea:[], dinner:[] };
  const allMissing = new Set();
  for (let i = 0; i < days; i++) {
    const d = new Date(startDate); d.setDate(d.getDate()+i);
    const key = d.toISOString().slice(0,10); const meals = {};
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
    const key = d.toISOString().slice(0,10), dow = d.getDay();
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
    const key = d.toISOString().slice(0,10), dow = d.getDay();
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
    const key = d.toISOString().slice(0,10);
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
        const sel = opts.map(o => `<option value="${o.name}" ${m.name===o.name?"selected":""}>${o.display}${o.fullyCookable?"":" ⚠"}</option>`).join("");
        html += `<div class="meal-row"><b>${icon} ${slot}</b>
          <select data-date="${d.date}" data-slot="${slot}">${sel || `<option>—</option>`}</select></div>`;
      } else {
        const miss = (m.missing||[]).length ? `<span class="miss">needs: ${m.missing.join(", ")}</span>` : "";
        html += `<div class="meal-row${m.missing?.length?" partial":""}"><b>${icon} ${slot}</b>${m.display || "—"}${miss}</div>`;
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

document.getElementById("plan-start").value = new Date().toISOString().slice(0,10);

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
  trackerMonth = new Date(yr, mo-2, 1).toISOString().slice(0,7);
  renderTrackerMonth();
};
document.getElementById("tracker-next").onclick = () => {
  const [yr, mo] = trackerMonth.split("-").map(Number);
  trackerMonth = new Date(yr, mo, 1).toISOString().slice(0,7);
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
function checkReminders() {
  if (!("Notification" in window) || Notification.permission !== "granted") return;
  const now = new Date(), today = now.toISOString().slice(0,10), hhmm = now.toTimeString().slice(0,5);
  Store.state.reminders.forEach(r => {
    if (!r.active || !r.time || r.time !== hhmm) return;
    if (r.frequency === "weekly" && now.getDay() !== 1) return;
    const stamp = today + "-" + hhmm;
    if (Store.state.notifiedDates[r.id] === stamp) return;
    new Notification("Pachaka Lokam", { body: r.title, icon: "assets/logo.png" });
    Store.state.notifiedDates[r.id] = stamp; Store.save();
  });
}
setInterval(checkReminders, 30*1000);

if ("serviceWorker" in navigator) navigator.serviceWorker.register("sw.js").catch(()=>{});

// ===== INIT =====
Store.load();
initRegionSelector();
initFestivalMode();
renderFestivalBanner();
renderToday();
renderKitchen();
renderReminders();
renderMealsTab();

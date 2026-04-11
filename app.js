/* Pachaka Lokam v0.4 — Kitchen + Grocery split, strict pantry meal engine. */

const STORAGE_KEY = "pl_state_v3";
const uid = () => Math.random().toString(36).slice(2, 10);

// ============== STORE ==============
const Store = {
  state: null,
  load() {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) { try { this.state = JSON.parse(raw); return; } catch {} }
    ["pl_state_v1","pl_state_v2"].forEach(k => localStorage.removeItem(k));
    const items = [];
    GROCERY_SEED.forEach(g => {
      const seasonal = g.category.includes("Seasonal");
      g.items.forEach(([name, u]) => items.push({
        id: uid(), name, category: g.category,
        unit: u.unit, qty: 0, step: u.step, defaultQty: u.defaultQty,
        needsBuy: false, seasonal,
      }));
    });
    this.state = {
      items, plans: {}, reminders: REMINDER_SEED.map(r => ({ id: uid(), ...r })),
      notifiedDates: {},
    };
    this.save();
  },
  save() { localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state)); },
};

// ============== TABS ==============
document.querySelectorAll(".tab").forEach(t => {
  t.onclick = () => {
    document.querySelectorAll(".tab").forEach(x => x.classList.remove("active"));
    document.querySelectorAll(".panel").forEach(x => x.classList.remove("active"));
    t.classList.add("active");
    document.getElementById(t.dataset.tab).classList.add("active");
    if (t.dataset.tab === "grocery") renderGrocery();
    if (t.dataset.tab === "kitchen") renderKitchen();
  };
});

// ============== KITCHEN TAB ==============
function renderKitchen() {
  const root = document.getElementById("kitchen-groups");
  root.innerHTML = "";
  const groups = {};
  Store.state.items.forEach(it => { (groups[it.category] ||= []).push(it); });

  Object.entries(groups).forEach(([cat, items]) => {
    const stocked = items.filter(i => i.qty > 0);
    const empty   = items.filter(i => i.qty === 0);
    const div = document.createElement("div");
    div.className = "category";
    div.innerHTML = `<h3>${cat} <span class="count">${stocked.length}/${items.length} stocked</span></h3>
      <div class="items stocked-grid"></div>
      ${empty.length ? `<details><summary>Not in kitchen (${empty.length})</summary><div class="items empty-grid"></div></details>` : ""}`;
    const sBox = div.querySelector(".stocked-grid");
    const eBox = div.querySelector(".empty-grid");

    stocked.forEach(it => {
      const el = document.createElement("div");
      el.className = "item stocked";
      el.innerHTML = `<span class="name">${it.name}</span>
        <input type="number" class="qty" value="${it.qty}" min="0" step="${it.step}" />
        <span class="unit">${it.unit}</span>
        <button class="btn xs" title="Used up">Out</button>`;
      const [, qty, , out] = el.children;
      qty.onchange = () => {
        const v = parseFloat(qty.value) || 0;
        it.qty = v;
        if (v === 0) { it.needsBuy = true; }
        Store.save(); renderKitchen();
      };
      out.onclick = () => {
        it.qty = 0; it.needsBuy = true;
        Store.save(); renderKitchen();
      };
      sBox.appendChild(el);
    });
    if (eBox) empty.forEach(it => {
      const el = document.createElement("div");
      el.className = "item empty";
      el.innerHTML = `<span class="name">${it.name}</span>
        <span class="unit">${it.unit}</span>
        <button class="btn xs primary">Got it</button>
        <button class="btn xs">+ Buy</button>`;
      const [, , got, buy] = el.children;
      got.onclick = () => {
        it.qty = it.defaultQty; it.needsBuy = false;
        Store.save(); renderKitchen();
      };
      buy.onclick = () => {
        it.needsBuy = true;
        Store.save(); renderKitchen();
      };
      sBox.appendChild(el); // show in stocked grid grayed
      // Actually append to empty box
      eBox.appendChild(el);
    });
    root.appendChild(div);
  });
}

document.getElementById("btn-reset-month").onclick = () => {
  if (!confirm("Reset month? All quantities will be cleared and items moved to Grocery list.")) return;
  Store.state.items.forEach(it => { it.qty = 0; it.needsBuy = true; });
  Store.save(); renderKitchen();
};

// ============== GROCERY TAB ==============
function renderGrocery() {
  const root = document.getElementById("grocery-list");
  root.innerHTML = "";
  const toBuy = Store.state.items.filter(i => i.needsBuy);
  if (!toBuy.length) {
    root.innerHTML = `<p class="hint">Nothing to buy. Mark items as "Out" in Kitchen to add them here.</p>`;
    return;
  }
  const groups = {};
  toBuy.forEach(it => { (groups[it.category] ||= []).push(it); });
  Object.entries(groups).forEach(([cat, items]) => {
    const div = document.createElement("div");
    div.className = "category";
    div.innerHTML = `<h3>${cat} <span class="count">${items.length} item${items.length>1?"s":""}</span></h3><div class="items"></div>`;
    const box = div.querySelector(".items");
    items.forEach(it => {
      const el = document.createElement("div");
      el.className = "item";
      el.innerHTML = `<span class="name">${it.name}</span>
        <input type="number" class="qty" value="${it.defaultQty}" min="0" step="${it.step}" />
        <span class="unit">${it.unit}</span>
        <button class="btn xs primary">Bought</button>`;
      const [, qty, , buy] = el.children;
      buy.onclick = () => {
        it.qty = parseFloat(qty.value) || it.defaultQty;
        it.needsBuy = false;
        Store.save(); renderGrocery();
      };
      box.appendChild(el);
    });
    root.appendChild(div);
  });
}

// ============== PANTRY MATCHING ==============
function pantry() {
  return new Set(Store.state.items.filter(i => i.qty > 0).map(i => i.name.toLowerCase()));
}
function has(token, p) {
  const t = token.toLowerCase();
  if (t === "coconut")     return p.has("coconut");
  if (t === "coconut oil") return p.has("coconut oil");
  for (const x of p) if (x.includes(t)) return true;
  return false;
}
function pickAll(list, p)   { return list.filter(x => has(x, p)); }
function pickFirst(list, p) { return list.find(x => has(x, p)); }

// ============== MEAL ENGINE ==============
function tryCook(meal, p, recent) {
  if (recent.includes(meal.name)) return null;
  for (const b of meal.base) if (!has(b, p)) return null;
  const ctx = { matched: [] };
  if (meal.minFrom) {
    ctx.matched = pickAll(meal.minFrom, p);
    if (ctx.matched.length < meal.minCount) return null;
  }
  if (meal.withSide) {
    const hit = SIDE_DISHES.find(s => p.has(s.veg));
    ctx.side = hit ? hit.name : null;
  }
  if (meal.withCurry) {
    // Find first curry whose needs[] are stocked AND (if minFrom) enough optional veg in stock
    let chosen = null;
    for (const cu of DINNER_CURRIES) {
      if (!cu.needs.every(n => has(n, p))) continue;
      if (cu.minFrom) {
        const m = pickAll(cu.minFrom, p);
        if (m.length < cu.minCount) continue;
        chosen = { name: cu.render ? cu.render(m.map(cap)) : cu.name };
        break;
      }
      chosen = { name: cu.render ? cu.render([]) : cu.name };
      break;
    }
    if (!chosen) return null;
    ctx.curry = chosen.name;
  }
  const display = meal.render ? meal.render(ctx) : meal.name;
  return { name: meal.name, display, simple: meal.simple, special: meal.special };
}

function pickMeal(slot, p, recent) {
  const pool = MEAL_RULES[slot];
  const cookable = pool.map(m => tryCook(m, p, recent)).filter(Boolean);
  if (!cookable.length) return null;

  // Lunch: 15% chance to pick a special if any cookable
  if (slot === "lunch") {
    const specials = cookable.filter(c => c.special);
    if (specials.length && Math.random() < 0.15)
      return specials[Math.floor(Math.random() * specials.length)];
  }
  const normal = cookable.filter(c => !c.special);
  const candidates = normal.length ? normal : cookable;
  const simple = candidates.filter(c => c.simple);
  const pool2  = (simple.length && Math.random() < 0.8) ? simple : candidates;
  return pool2[Math.floor(Math.random() * pool2.length)];
}

function generatePlan(startDate, days = 7) {
  const p = pantry();
  const plan = [];
  const recent = { breakfast: [], lunch: [], tea: [], dinner: [] };
  for (let i = 0; i < days; i++) {
    const d = new Date(startDate); d.setDate(d.getDate() + i);
    const key = d.toISOString().slice(0, 10);
    const meals = {};
    for (const slot of ["breakfast","lunch","tea","dinner"]) {
      const pick = pickMeal(slot, p, recent[slot].slice(-2));
      if (pick) {
        meals[slot] = { display: pick.display };
        recent[slot].push(pick.name);
      } else {
        meals[slot] = { display: "—", missing: true };
      }
    }
    Store.state.plans[key] = meals;
    plan.push({ date: key, meals });
  }
  Store.save();
  return plan;
}

function renderPlan(plan) {
  const grid = document.getElementById("plan-grid");
  grid.innerHTML = "";
  let gaps = 0;
  plan.forEach(d => {
    const card = document.createElement("div");
    card.className = "day-card";
    const label = new Date(d.date).toLocaleDateString(undefined, { weekday:"short", month:"short", day:"numeric" });
    const row = (slot, icon) => {
      const m = d.meals[slot] || {};
      if (m.missing) gaps++;
      const cls = m.missing ? "meal-row missing" : "meal-row";
      return `<div class="${cls}"><b>${icon} ${slot}</b>${m.display || "—"}</div>`;
    };
    card.innerHTML = `<h4>${label}</h4>
      ${row("breakfast","🌅")}${row("lunch","🍛")}${row("tea","☕")}${row("dinner","🌙")}`;
    grid.appendChild(card);
  });
  const note = document.getElementById("plan-note");
  note.textContent = gaps
    ? `${gaps} slot${gaps>1?"s":""} couldn't be filled — stock more ingredients in Kitchen and regenerate.`
    : `All ${plan.length * 4} slots filled from your kitchen.`;
}

document.getElementById("plan-start").value = new Date().toISOString().slice(0, 10);
document.getElementById("btn-generate").onclick = () => {
  renderPlan(generatePlan(document.getElementById("plan-start").value, 7));
};

function loadExistingPlan() {
  const start = document.getElementById("plan-start").value;
  const plan = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(start); d.setDate(d.getDate() + i);
    const key = d.toISOString().slice(0, 10);
    if (Store.state.plans[key]) plan.push({ date: key, meals: Store.state.plans[key] });
  }
  if (plan.length) renderPlan(plan);
}

// ============== REMINDERS ==============
function renderReminders() {
  const root = document.getElementById("reminder-list");
  root.innerHTML = "";
  Store.state.reminders.forEach(r => {
    const el = document.createElement("div");
    el.className = "rem" + (r.active ? "" : " off");
    el.innerHTML = `<div><b>${r.title}</b><div class="meta">${r.frequency}${r.time?" · "+r.time:""}</div></div>
      <div class="actions"><button class="btn">${r.active?"Pause":"Resume"}</button>
      <button class="btn" style="color:#c0392b">Delete</button></div>`;
    const [tg, dl] = el.querySelectorAll("button");
    tg.onclick = () => { r.active = !r.active; Store.save(); renderReminders(); };
    dl.onclick = () => {
      Store.state.reminders = Store.state.reminders.filter(x => x.id !== r.id);
      Store.save(); renderReminders();
    };
    root.appendChild(el);
  });
}
document.getElementById("btn-add-rem").onclick = () => {
  const title = document.getElementById("r-title").value.trim();
  if (!title) return;
  Store.state.reminders.push({
    id: uid(), title,
    frequency: document.getElementById("r-freq").value,
    time: document.getElementById("r-time").value || null,
    active: true,
  });
  Store.save();
  document.getElementById("r-title").value = "";
  renderReminders();
};
document.getElementById("btn-enable-notif").onclick = async () => {
  if (!("Notification" in window)) return alert("Notifications not supported.");
  const res = await Notification.requestPermission();
  alert(res === "granted" ? "Notifications enabled ✅" : "Permission: " + res);
};
function checkReminders() {
  if (!("Notification" in window) || Notification.permission !== "granted") return;
  const now = new Date();
  const today = now.toISOString().slice(0, 10);
  const hhmm = now.toTimeString().slice(0, 5);
  Store.state.reminders.forEach(r => {
    if (!r.active || !r.time || r.time !== hhmm) return;
    if (r.frequency === "weekly" && now.getDay() !== 1) return;
    const stamp = today + "-" + hhmm;
    if (Store.state.notifiedDates[r.id] === stamp) return;
    new Notification("Pachaka Lokam", { body: r.title, icon: "assets/logo.png" });
    Store.state.notifiedDates[r.id] = stamp; Store.save();
  });
}
setInterval(checkReminders, 30 * 1000);

if ("serviceWorker" in navigator) navigator.serviceWorker.register("sw.js").catch(() => {});

Store.load();
renderKitchen();
loadExistingPlan();
renderReminders();

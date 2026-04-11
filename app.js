/* Pachaka Lokam v2 — units + pantry-aware meal logic.
 * Storage key bumped to pl_state_v2; v1 is dropped on first load.
 * State: { grocery:[{id,name,category,unit,qty,step,checked,seasonal}],
 *          plans:{}, reminders:[...], notifiedDates:{}, settings:{pantryMode} }
 */
const STORAGE_KEY = "pl_state_v2";
const uid = () => Math.random().toString(36).slice(2, 10);

const Store = {
  state: null,
  load() {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) { try { this.state = JSON.parse(raw); return; } catch {} }
    localStorage.removeItem("pl_state_v1"); // drop legacy
    const grocery = [];
    GROCERY_SEED.forEach(g => {
      const seasonal = g.category.includes("Seasonal");
      g.items.forEach(([name, u]) => grocery.push({
        id: uid(), name, category: g.category,
        unit: u.unit, qty: 0, step: u.step, defaultQty: u.defaultQty,
        checked: false, seasonal,
      }));
    });
    this.state = {
      grocery, plans: {},
      reminders: REMINDER_SEED.map(r => ({ id: uid(), ...r })),
      notifiedDates: {},
      settings: { pantryMode: true },
    };
    this.save();
  },
  save() { localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state)); },
};

// ---------- Tabs ----------
document.querySelectorAll(".tab").forEach(t => {
  t.onclick = () => {
    document.querySelectorAll(".tab").forEach(x => x.classList.remove("active"));
    document.querySelectorAll(".panel").forEach(x => x.classList.remove("active"));
    t.classList.add("active");
    document.getElementById(t.dataset.tab).classList.add("active");
  };
});

// ---------- Grocery ----------
function renderGrocery() {
  const root = document.getElementById("grocery-groups");
  root.innerHTML = "";
  const groups = {};
  Store.state.grocery.forEach(it => { (groups[it.category] ||= []).push(it); });

  Object.entries(groups).forEach(([cat, items]) => {
    const inStock = items.filter(i => i.qty > 0).length;
    const div = document.createElement("div");
    div.className = "category";
    div.innerHTML = `<h3>${cat} <span class="count">${inStock}/${items.length} in stock</span></h3><div class="items"></div>`;
    const box = div.querySelector(".items");
    items.forEach(it => {
      const el = document.createElement("label");
      el.className = "item" + (it.checked ? " checked" : "") + (it.qty > 0 ? " stocked" : "");
      el.innerHTML = `
        <input type="checkbox" ${it.checked ? "checked" : ""} />
        <span class="name">${it.name}</span>
        <input type="number" class="qty" value="${it.qty || ""}" placeholder="${it.defaultQty}" min="0" step="${it.step}" />
        <span class="unit">${it.unit}</span>
      `;
      const [cb, , qty] = el.children;
      cb.onchange = () => {
        it.checked = cb.checked;
        // First check auto-fills default qty for convenience
        if (it.checked && !it.qty) { it.qty = it.defaultQty; qty.value = it.defaultQty; }
        el.classList.toggle("checked", it.checked);
        el.classList.toggle("stocked", it.qty > 0);
        Store.save();
        updateStockHeader(div, items);
      };
      qty.onchange = () => {
        it.qty = parseFloat(qty.value) || 0;
        el.classList.toggle("stocked", it.qty > 0);
        Store.save();
        updateStockHeader(div, items);
      };
      box.appendChild(el);
    });
    root.appendChild(div);
  });
}
function updateStockHeader(div, items) {
  const n = items.filter(i => i.qty > 0).length;
  div.querySelector(".count").textContent = `${n}/${items.length} in stock`;
}

document.getElementById("btn-add-item").onclick = () => {
  const name = document.getElementById("g-name").value.trim();
  const category = document.getElementById("g-cat").value.trim() || "Other";
  const unit = document.getElementById("g-unit").value || "nos";
  if (!name) return;
  Store.state.grocery.push({
    id: uid(), name, category, unit, qty: 0, step: 1, defaultQty: 1,
    checked: false, seasonal: false,
  });
  Store.save();
  document.getElementById("g-name").value = "";
  document.getElementById("g-cat").value = "";
  renderGrocery();
};

document.getElementById("btn-reset-month").onclick = () => {
  if (!confirm("Reset checks and quantities for the new month?")) return;
  Store.state.grocery.forEach(it => { it.checked = false; it.qty = 0; });
  Store.save();
  renderGrocery();
};

// ---------- Pantry matching (rule-based) ----------
function pantrySet() {
  return Store.state.grocery
    .filter(i => i.qty > 0)
    .map(i => i.name.toLowerCase());
}
function ingredientAvailable(token, pantry) {
  const t = token.toLowerCase();
  // Prevent "coconut" from matching "coconut oil" and vice versa
  return pantry.some(p => {
    if (t === "coconut")     return p === "coconut";
    if (t === "coconut oil") return p === "coconut oil";
    return p.includes(t);
  });
}
function scoreMeal(meal, pantry) {
  const missing = meal.ingredients.filter(i => !ingredientAvailable(i, pantry));
  return { have: meal.ingredients.length - missing.length, missing };
}

// ---------- Meal Plan ----------
function generatePlan(startDate, days = 7) {
  const pantry = pantrySet();
  const pantryMode = Store.state.settings.pantryMode;
  const plan = [];
  const recent = { breakfast: [], lunch: [], dinner: [] };

  for (let i = 0; i < days; i++) {
    const d = new Date(startDate); d.setDate(d.getDate() + i);
    const key = d.toISOString().slice(0, 10);
    const meals = {};
    for (const mt of ["breakfast", "lunch", "dinner"]) {
      const pool = MEAL_CATALOG[mt];
      const scored = pool.map(m => ({ meal: m, ...scoreMeal(m, pantry) }));
      const notRecent = m => !recent[mt].slice(-2).includes(m.name);

      let candidates;
      if (pantryMode) {
        // Tier 1: fully cookable + not recent
        candidates = scored.filter(s => s.missing.length === 0 && notRecent(s.meal));
        if (!candidates.length) candidates = scored.filter(s => s.missing.length === 0);
        // Tier 2: best partial (min missing), to keep the plan usable
        if (!candidates.length) {
          const min = Math.min(...scored.map(s => s.missing.length));
          candidates = scored.filter(s => s.missing.length === min);
        }
      } else {
        candidates = scored.filter(s => notRecent(s.meal));
        if (!candidates.length) candidates = scored;
      }

      // 80% simple rule within candidates
      const simple = candidates.filter(c => c.meal.simple);
      const pool2  = (simple.length && Math.random() < 0.8) ? simple : candidates;
      const pick   = pool2[Math.floor(Math.random() * pool2.length)];
      recent[mt].push(pick.meal.name);
      meals[mt] = { name: pick.meal.name, missing: pick.missing };
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
  const shortfall = new Set();
  plan.forEach(d => {
    const card = document.createElement("div");
    card.className = "day-card";
    const label = new Date(d.date).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
    const row = (slot) => {
      const m = d.meals[slot];
      // Handle both v2 objects and any legacy strings
      const name = typeof m === "string" ? m : (m?.name || "-");
      const miss = typeof m === "object" ? (m.missing || []) : [];
      miss.forEach(x => shortfall.add(x));
      const badge = miss.length ? `<span class="miss">need: ${miss.join(", ")}</span>` : "";
      return `<div class="meal-row"><b>${slot}</b>${name}${badge}</div>`;
    };
    card.innerHTML = `<h4>${label}</h4>${row("breakfast")}${row("lunch")}${row("dinner")}`;
    grid.appendChild(card);
  });

  const sf = document.getElementById("shortfall");
  if (shortfall.size) {
    sf.style.display = "block";
    sf.innerHTML = `<b>Shopping list from this plan:</b> ${[...shortfall].join(", ")}`;
  } else {
    sf.style.display = "none";
  }
}

document.getElementById("plan-start").value = new Date().toISOString().slice(0, 10);
document.getElementById("btn-generate").onclick = () => {
  renderPlan(generatePlan(document.getElementById("plan-start").value, 7));
};

const pantryToggle = document.getElementById("pantry-mode");
pantryToggle.checked = true;
pantryToggle.onchange = () => {
  Store.state.settings.pantryMode = pantryToggle.checked;
  Store.save();
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

// ---------- Reminders ----------
function renderReminders() {
  const root = document.getElementById("reminder-list");
  root.innerHTML = "";
  Store.state.reminders.forEach(r => {
    const el = document.createElement("div");
    el.className = "rem" + (r.active ? "" : " off");
    el.innerHTML = `
      <div><b>${r.title}</b><div class="meta">${r.frequency}${r.time ? " · " + r.time : ""}</div></div>
      <div class="actions">
        <button class="btn">${r.active ? "Pause" : "Resume"}</button>
        <button class="btn" style="color:#c0392b">Delete</button>
      </div>`;
    const [toggle, del] = el.querySelectorAll("button");
    toggle.onclick = () => { r.active = !r.active; Store.save(); renderReminders(); };
    del.onclick = () => {
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

// ---------- Notifications ----------
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
    Store.state.notifiedDates[r.id] = stamp;
    Store.save();
  });
}
setInterval(checkReminders, 30 * 1000);

if ("serviceWorker" in navigator) navigator.serviceWorker.register("sw.js").catch(() => {});

Store.load();
renderGrocery();
loadExistingPlan();
renderReminders();

/* Pachaka Lokam — offline-first controller.
 * State shape (localStorage key: "pl_state" v1):
 *   { grocery: [{id,name,category,qty,checked,seasonal}],
 *     plans:   { "YYYY-MM-DD": {breakfast,lunch,dinner} },
 *     reminders:[{id,title,frequency,time,active}],
 *     notifiedDates: { "<remId>": "YYYY-MM-DD" } }
 */

const STORAGE_KEY = "pl_state_v1";
const uid = () => Math.random().toString(36).slice(2, 10);

// ---------- Store ----------
const Store = {
  state: null,
  load() {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try { this.state = JSON.parse(raw); return; } catch {}
    }
    // First run — seed from data.js
    const grocery = [];
    GROCERY_SEED.forEach(g => {
      const seasonal = g.category.includes("Seasonal");
      g.items.forEach(name =>
        grocery.push({ id: uid(), name, category: g.category, qty: 0, checked: false, seasonal })
      );
    });
    const reminders = REMINDER_SEED.map(r => ({ id: uid(), ...r }));
    this.state = { grocery, plans: {}, reminders, notifiedDates: {} };
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
    const div = document.createElement("div");
    div.className = "category";
    div.innerHTML = `<h3>${cat}</h3><div class="items"></div>`;
    const box = div.querySelector(".items");
    items.forEach(it => {
      const el = document.createElement("label");
      el.className = "item" + (it.checked ? " checked" : "");
      el.innerHTML = `
        <input type="checkbox" ${it.checked ? "checked" : ""} />
        <span class="name">${it.name}</span>
        <input type="number" class="qty" value="${it.qty || ""}" placeholder="qty" min="0" />
      `;
      const [cb, , qty] = el.children;
      cb.onchange = () => {
        it.checked = cb.checked;
        el.classList.toggle("checked", it.checked);
        Store.save();
      };
      qty.onchange = () => { it.qty = parseFloat(qty.value) || 0; Store.save(); };
      box.appendChild(el);
    });
    root.appendChild(div);
  });
}

document.getElementById("btn-add-item").onclick = () => {
  const name = document.getElementById("g-name").value.trim();
  const category = document.getElementById("g-cat").value.trim() || "Other";
  if (!name) return;
  Store.state.grocery.push({ id: uid(), name, category, qty: 0, checked: false, seasonal: false });
  Store.save();
  document.getElementById("g-name").value = "";
  document.getElementById("g-cat").value = "";
  renderGrocery();
};

document.getElementById("btn-reset-month").onclick = () => {
  if (!confirm("Reset all checks and quantities for the new month?")) return;
  Store.state.grocery.forEach(it => { it.checked = false; it.qty = 0; });
  Store.save();
  renderGrocery();
};

// ---------- Meal Plan ----------
function generatePlan(startDate, days = 7) {
  const plan = [];
  const recent = { breakfast: [], lunch: [], dinner: [] };
  for (let i = 0; i < days; i++) {
    const d = new Date(startDate);
    d.setDate(d.getDate() + i);
    const key = d.toISOString().slice(0, 10);
    const meals = {};
    for (const mt of ["breakfast", "lunch", "dinner"]) {
      const pool = MEAL_CATALOG[mt];
      const avail = pool.filter(m => !recent[mt].slice(-2).includes(m.name));
      const use = avail.length ? avail : pool;
      const simple = use.filter(m => m.simple);
      // 80% simple rule
      const pick = (simple.length && Math.random() < 0.8)
        ? simple[Math.floor(Math.random() * simple.length)]
        : use[Math.floor(Math.random() * use.length)];
      recent[mt].push(pick.name);
      meals[mt] = pick.name;
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
  plan.forEach(d => {
    const card = document.createElement("div");
    card.className = "day-card";
    const label = new Date(d.date).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
    card.innerHTML = `
      <h4>${label}</h4>
      <div class="meal-row"><b>Breakfast</b>${d.meals.breakfast || "-"}</div>
      <div class="meal-row"><b>Lunch</b>${d.meals.lunch || "-"}</div>
      <div class="meal-row"><b>Dinner</b>${d.meals.dinner || "-"}</div>
    `;
    grid.appendChild(card);
  });
}

document.getElementById("plan-start").value = new Date().toISOString().slice(0, 10);
document.getElementById("btn-generate").onclick = () => {
  const start = document.getElementById("plan-start").value;
  renderPlan(generatePlan(start, 7));
};

function loadExistingPlan() {
  const start = document.getElementById("plan-start").value;
  const plan = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
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
      <div>
        <b>${r.title}</b>
        <div class="meta">${r.frequency}${r.time ? " · " + r.time : ""}</div>
      </div>
      <div class="actions">
        <button class="btn">${r.active ? "Pause" : "Resume"}</button>
        <button class="btn" style="color:#c0392b">Delete</button>
      </div>
    `;
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
  if (!("Notification" in window)) return alert("Notifications not supported on this device.");
  const res = await Notification.requestPermission();
  alert(res === "granted" ? "Notifications enabled ✅" : "Permission: " + res);
};

function checkReminders() {
  if (!("Notification" in window) || Notification.permission !== "granted") return;
  const now = new Date();
  const today = now.toISOString().slice(0, 10);
  const hhmm = now.toTimeString().slice(0, 5);
  Store.state.reminders.forEach(r => {
    if (!r.active || !r.time) return;
    // Daily at exact minute; weekly on same weekday as it was created/today
    if (r.time !== hhmm) return;
    // Weekly: only on Mondays for simplicity unless daily/custom
    if (r.frequency === "weekly" && now.getDay() !== 1) return;
    // Avoid double-firing within the same day
    if (Store.state.notifiedDates[r.id] === today + "-" + hhmm) return;
    new Notification("Pachaka Lokam", { body: r.title, icon: "assets/logo.png" });
    Store.state.notifiedDates[r.id] = today + "-" + hhmm;
    Store.save();
  });
}
setInterval(checkReminders, 30 * 1000); // check twice a minute

// ---------- Service worker (offline) ----------
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("sw.js").catch(() => {});
}

// ---------- Init ----------
Store.load();
renderGrocery();
loadExistingPlan();
renderReminders();

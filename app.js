/* Pachaka Lokam — offline-first controller.
 * State shape (localStorage key: "pl_state" v1):
 *   { grocery: [{id,name,category,qty,checked,seasonal}],
 *     plans:   { "YYYY-MM-DD": {breakfast,lunch,dinner} },
 *     reminders:[{id,title,frequency,time,active}],
 *     notifiedDates: { "<remId>": "YYYY-MM-DD" } }
 */

const STORAGE_KEY = "pl_state_v2";
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
    this.state = {
      grocery, plans: {}, reminders, notifiedDates: {},
      region: "Kerala",           // Default region; user can change
      festivalMode: "override",   // "override" | "regular" | "hybrid"
      festivalNotifScheduled: false,
    };
    this.save();
  },
  save() { localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state)); },
};

// ---------- State migration (v1 -> v2) ----------
(function migrateState() {
  if (!Store.state) return;
  if (!Store.state.region) Store.state.region = "Kerala";
  if (!Store.state.festivalMode) Store.state.festivalMode = "override";
  if (Store.state.festivalNotifScheduled === undefined) Store.state.festivalNotifScheduled = false;
  Store.save();
})();

// ---------- Festival Service ----------
const FestivalService = {
  /** Get all festivals matching user's selected region */
  getRegionalFestivals() {
    const region = Store.state.region || "Kerala";
    return FESTIVAL_DATA.filter(f => f.states.includes(region));
  },

  /** Find the currently active festival (if any) for the user's region */
  getActiveFestival() {
    const today = new Date();
    today.setHours(0,0,0,0);
    return this.getRegionalFestivals().find(f => {
      const start = new Date(f.startDate + "T00:00:00");
      const end   = new Date(f.endDate   + "T23:59:59");
      return today >= start && today <= end;
    }) || null;
  },

  /** Zero-based day offset within the festival */
  getDayIndex(festival) {
    const today = new Date();
    today.setHours(0,0,0,0);
    const start = new Date(festival.startDate + "T00:00:00");
    return Math.floor((today - start) / (1000 * 60 * 60 * 24));
  },

  /** Total duration of the festival in days */
  getDuration(festival) {
    const s = new Date(festival.startDate + "T00:00:00");
    const e = new Date(festival.endDate   + "T00:00:00");
    return Math.floor((e - s) / (1000 * 60 * 60 * 24)) + 1;
  },

  /** Resolve today's meal plan from the festival */
  getFestivalMealPlan(festival) {
    if (!festival) return null;
    const dayIndex = this.getDayIndex(festival);

    if (festival.mealPlan.type === "progressive") {
      const day = festival.mealPlan.days.find(d => d.dayOffset === dayIndex);
      return day ? { ...day.meals, _title: day.title } : null;
    }

    if (festival.mealPlan.type === "pattern") {
      const key = festival.mealPlan.pattern[dayIndex];
      return key ? festival.mealPlan.templates[key] : null;
    }

    // Static "festival" type
    return festival.mealPlan.meals || null;
  },

  /** Is today the peak day? */
  isPeakDay(festival) {
    const today = new Date().toISOString().slice(0, 10);
    return festival.peakDay === today;
  },

  /** Next upcoming festival (for countdown) */
  getNextFestival() {
    const today = new Date();
    today.setHours(0,0,0,0);
    const upcoming = this.getRegionalFestivals()
      .filter(f => new Date(f.startDate + "T00:00:00") > today)
      .sort((a, b) => new Date(a.startDate) - new Date(b.startDate));
    return upcoming[0] || null;
  },

  /** Days until a festival starts */
  daysUntil(festival) {
    const today = new Date();
    today.setHours(0,0,0,0);
    const start = new Date(festival.startDate + "T00:00:00");
    return Math.ceil((start - today) / (1000 * 60 * 60 * 24));
  },
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

// ---------- Meal Plan (Region-aware + Festival override) ----------
function getActiveMealCatalog() {
  const region = Store.state.region || "Kerala";
  return REGIONAL_MEALS[region] || REGIONAL_MEALS["Kerala"] || MEAL_CATALOG;
}

function generatePlan(startDate, days = 7) {
  const plan = [];
  const catalog = getActiveMealCatalog();
  const recent = { breakfast: [], lunch: [], dinner: [] };
  const mode = Store.state.festivalMode || "override";

  for (let i = 0; i < days; i++) {
    const d = new Date(startDate);
    d.setDate(d.getDate() + i);
    const key = d.toISOString().slice(0, 10);

    // Check for active festival on this date
    let festivalMeal = null;
    let festivalInfo = null;
    const checkDate = new Date(d);
    checkDate.setHours(0,0,0,0);

    for (const f of (FESTIVAL_DATA || [])) {
      if (!f.states.includes(Store.state.region || "Kerala")) continue;
      const fs = new Date(f.startDate + "T00:00:00");
      const fe = new Date(f.endDate + "T23:59:59");
      if (checkDate >= fs && checkDate <= fe) {
        festivalInfo = f;
        const dayIdx = Math.floor((checkDate - fs) / (1000*60*60*24));
        if (f.mealPlan.type === "progressive") {
          const dayEntry = f.mealPlan.days.find(dd => dd.dayOffset === dayIdx);
          festivalMeal = dayEntry ? dayEntry.meals : null;
        } else if (f.mealPlan.type === "pattern") {
          const tplKey = f.mealPlan.pattern[dayIdx];
          festivalMeal = tplKey ? f.mealPlan.templates[tplKey] : null;
        } else {
          festivalMeal = f.mealPlan.meals;
        }
        break;
      }
    }

    const meals = {};
    const isFestival = festivalMeal && mode !== "regular";

    for (const mt of ["breakfast", "lunch", "dinner"]) {
      if (isFestival && festivalMeal[mt]) {
        meals[mt] = festivalMeal[mt].join(", ");
      } else {
        // Regular generation with 80% simple rule
        const pool = catalog[mt] || MEAL_CATALOG[mt] || [];
        const avail = pool.filter(m => !recent[mt].slice(-2).includes(m.name));
        const use = avail.length ? avail : pool;
        const simple = use.filter(m => m.simple);
        const pick = (simple.length && Math.random() < 0.8)
          ? simple[Math.floor(Math.random() * simple.length)]
          : use[Math.floor(Math.random() * use.length)];
        if (pick) { recent[mt].push(pick.name); meals[mt] = pick.name; }
        else { meals[mt] = "-"; }
      }
    }

    const entry = { date: key, meals };
    if (isFestival) {
      entry.festival = festivalInfo.name;
      entry.greeting = festivalInfo.greeting;
    }
    Store.state.plans[key] = meals;
    plan.push(entry);
  }
  Store.save();
  return plan;
}

function renderPlan(plan) {
  const grid = document.getElementById("plan-grid");
  grid.innerHTML = "";
  plan.forEach(d => {
    const card = document.createElement("div");
    card.className = d.festival ? "day-card festival-day" : "day-card";
    const label = new Date(d.date).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
    const festBadge = d.festival
      ? `<div class="fest-badge">${d.festival}</div>`
      : "";
    card.innerHTML = `
      ${festBadge}
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

// ---------- Festival Banner + Dashboard ----------
function renderFestivalBanner() {
  const banner = document.getElementById("festival-banner");
  if (!banner) return;
  const active = FestivalService.getActiveFestival();

  if (active) {
    const dayIdx  = FestivalService.getDayIndex(active);
    const total   = FestivalService.getDuration(active);
    const isPeak  = FestivalService.isPeakDay(active);
    const pct     = Math.round(((dayIdx + 1) / total) * 100);
    const meals   = FestivalService.getFestivalMealPlan(active);

    banner.className = "festival-banner active";
    banner.innerHTML = `
      <div class="fest-greeting">${active.greeting}</div>
      <div class="fest-progress">
        <span>Day ${dayIdx + 1} of ${total}${isPeak ? " — Peak Day!" : ""}</span>
        <div class="progress-bar"><div class="progress-fill" style="width:${pct}%"></div></div>
      </div>
      ${meals ? `<div class="fest-meals">
        <b>Today's Festival Menu:</b>
        ${meals.lunch  ? `<div class="fest-dish"><span>Lunch</span>${Array.isArray(meals.lunch) ? meals.lunch.join(", ") : meals.lunch}</div>` : ""}
        ${meals.breakfast ? `<div class="fest-dish"><span>Breakfast</span>${Array.isArray(meals.breakfast) ? meals.breakfast.join(", ") : meals.breakfast}</div>` : ""}
        ${meals.dinner ? `<div class="fest-dish"><span>Dinner</span>${Array.isArray(meals.dinner) ? meals.dinner.join(", ") : meals.dinner}</div>` : ""}
      </div>` : ""}
    `;
  } else {
    const next = FestivalService.getNextFestival();
    if (next) {
      const daysLeft = FestivalService.daysUntil(next);
      banner.className = "festival-banner upcoming";
      banner.innerHTML = `
        <div class="fest-upcoming">Next: <b>${next.name}</b> in ${daysLeft} day${daysLeft !== 1 ? "s" : ""}</div>
      `;
    } else {
      banner.className = "festival-banner";
      banner.innerHTML = "";
    }
  }
}

function renderFestivalPanel() {
  const list = document.getElementById("festival-list");
  if (!list) return;
  const festivals = FestivalService.getRegionalFestivals();
  list.innerHTML = "";
  if (!festivals.length) {
    list.innerHTML = `<p style="color:var(--muted)">No festivals configured for ${Store.state.region}.</p>`;
    return;
  }
  const today = new Date();
  today.setHours(0,0,0,0);

  festivals.sort((a, b) => new Date(a.startDate) - new Date(b.startDate));

  festivals.forEach(f => {
    const start = new Date(f.startDate + "T00:00:00");
    const end   = new Date(f.endDate   + "T23:59:59");
    const isActive = today >= start && today <= end;
    const isPast   = today > end;
    const card = document.createElement("div");
    card.className = "fest-card" + (isActive ? " active" : "") + (isPast ? " past" : "");
    const duration = FestivalService.getDuration(f);
    const dateRange = duration === 1
      ? new Date(f.startDate).toLocaleDateString(undefined, { month: "short", day: "numeric" })
      : `${new Date(f.startDate).toLocaleDateString(undefined, { month: "short", day: "numeric" })} – ${new Date(f.endDate).toLocaleDateString(undefined, { month: "short", day: "numeric" })}`;
    const statusBadge = isActive ? '<span class="badge live">Live</span>'
      : isPast ? '<span class="badge past">Passed</span>'
      : `<span class="badge soon">${FestivalService.daysUntil(f)}d away</span>`;

    const mealType = f.mealPlan.type === "pattern" ? "Pattern-based"
      : f.mealPlan.type === "progressive" ? "Progressive"
      : "Single-day";

    card.innerHTML = `
      <div class="fest-card-head">
        <h4>${f.name}</h4>
        ${statusBadge}
      </div>
      <div class="fest-card-meta">
        <span>${dateRange}</span> · <span>${duration} day${duration > 1 ? "s" : ""}</span> · <span>${mealType}</span>
      </div>
      <div class="fest-card-states">${f.states.join(", ")}</div>
    `;
    list.appendChild(card);
  });
}

// ---------- Region Selector ----------
function initRegionSelector() {
  const sel = document.getElementById("region-select");
  if (!sel) return;
  sel.value = Store.state.region || "Kerala";
  sel.onchange = () => {
    Store.state.region = sel.value;
    Store.save();
    renderFestivalBanner();
    renderFestivalPanel();
    // Update meal plan heading
    const mealHeading = document.querySelector("#meals .toolbar h2");
    if (mealHeading) mealHeading.textContent = `${sel.value} Meal Plan`;
  };
}

// ---------- Festival Mode Toggle ----------
function initFestivalMode() {
  const toggle = document.getElementById("festival-mode");
  if (!toggle) return;
  toggle.value = Store.state.festivalMode || "override";
  toggle.onchange = () => {
    Store.state.festivalMode = toggle.value;
    Store.save();
  };
}

// ---------- Festival Notifications ----------
function scheduleFestivalNotifications() {
  if (!("Notification" in window) || Notification.permission !== "granted") return;
  // Use the existing reminder-check loop — add festival greetings as one-time checks
  const today = new Date().toISOString().slice(0, 10);
  const active = FestivalService.getActiveFestival();
  if (active && FestivalService.isPeakDay(active)) {
    const notifKey = `fest_${active.name}_${today}`;
    if (!Store.state.notifiedDates[notifKey]) {
      new Notification("Pachaka Lokam", {
        body: active.greeting,
        icon: "assets/logo.png",
      });
      Store.state.notifiedDates[notifKey] = today;
      Store.save();
    }
  }
}

// Extend existing reminder check to include festival notifications
const _origCheckReminders = checkReminders;
checkReminders = function() {
  _origCheckReminders();
  scheduleFestivalNotifications();
};

// ---------- Init ----------
Store.load();
renderGrocery();
loadExistingPlan();
renderReminders();
renderFestivalBanner();
renderFestivalPanel();
initRegionSelector();
initFestivalMode();

// Update meal heading to show region
const _mealHeading = document.querySelector("#meals .toolbar h2");
if (_mealHeading) _mealHeading.textContent = `${Store.state.region || "Kerala"} Meal Plan`;

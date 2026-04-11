// Pachaka Lokam - frontend controller
const api = (p, opts = {}) =>
  fetch(`/api${p}`, { headers: { "Content-Type": "application/json" }, ...opts }).then(r => r.json());

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
async function loadGrocery() {
  const groups = await api("/grocery/grouped");
  const root = document.getElementById("grocery-groups");
  root.innerHTML = "";
  for (const [cat, items] of Object.entries(groups)) {
    const div = document.createElement("div");
    div.className = "category";
    div.innerHTML = `<h3>${cat}</h3><div class="items"></div>`;
    const box = div.querySelector(".items");
    items.forEach(it => {
      const el = document.createElement("label");
      el.className = "item" + (it.checked ? " checked" : "");
      el.innerHTML = `
        <input type="checkbox" ${it.checked ? "checked" : ""} />
        <span style="flex:1">${it.name}</span>
        <input type="number" class="qty" value="${it.quantity || ""}" placeholder="qty" />
      `;
      const [cb, , qty] = el.children;
      cb.onchange = async () => {
        await api(`/grocery/${it.id}`, { method: "PATCH", body: JSON.stringify({ checked: cb.checked ? 1 : 0 }) });
        el.classList.toggle("checked", cb.checked);
      };
      qty.onchange = () =>
        api(`/grocery/${it.id}`, { method: "PATCH", body: JSON.stringify({ quantity: parseFloat(qty.value) || 0 }) });
      box.appendChild(el);
    });
    root.appendChild(div);
  }
}

document.getElementById("btn-add-item").onclick = async () => {
  const name = document.getElementById("g-name").value.trim();
  const category = document.getElementById("g-cat").value.trim() || "Other";
  if (!name) return;
  await api("/grocery", { method: "POST", body: JSON.stringify({ name, category }) });
  document.getElementById("g-name").value = "";
  document.getElementById("g-cat").value = "";
  loadGrocery();
};

document.getElementById("btn-reset-month").onclick = async () => {
  if (!confirm("Reset all checks and quantities for the new month?")) return;
  await api("/grocery/reset-month", { method: "POST" });
  loadGrocery();
};

// ---------- Meals ----------
document.getElementById("plan-start").value = new Date().toISOString().slice(0, 10);

async function renderPlan(plan) {
  const grid = document.getElementById("plan-grid");
  grid.innerHTML = "";
  plan.forEach(d => {
    const card = document.createElement("div");
    card.className = "day-card";
    const date = new Date(d.date);
    const label = date.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
    card.innerHTML = `
      <h4>${label}</h4>
      <div class="meal-row"><b>Breakfast</b><br>${d.meals.breakfast || "-"}</div>
      <div class="meal-row"><b>Lunch</b><br>${d.meals.lunch || "-"}</div>
      <div class="meal-row"><b>Dinner</b><br>${d.meals.dinner || "-"}</div>
    `;
    grid.appendChild(card);
  });
}

document.getElementById("btn-generate").onclick = async () => {
  const start = document.getElementById("plan-start").value;
  const r = await api("/meals/generate", { method: "POST", body: JSON.stringify({ start_date: start, days: 7 }) });
  renderPlan(r.plan);
};

async function loadExistingPlan() {
  const start = document.getElementById("plan-start").value;
  const data = await api(`/meals/plan?start_date=${start}&days=7`);
  const plan = Object.entries(data).map(([date, meals]) => ({ date, meals }));
  if (plan.length) renderPlan(plan);
}

// ---------- Reminders ----------
async function loadReminders() {
  const list = await api("/reminders");
  const root = document.getElementById("reminder-list");
  root.innerHTML = "";
  list.forEach(r => {
    const el = document.createElement("div");
    el.className = "rem" + (r.active ? "" : " off");
    el.innerHTML = `
      <div><b>${r.title}</b><div class="meta">${r.frequency}${r.time_of_day ? " · " + r.time_of_day : ""}</div></div>
      <div><button class="btn">${r.active ? "Pause" : "Resume"}</button>
           <button class="btn" style="color:#c0392b">Delete</button></div>
    `;
    const [toggle, del] = el.querySelectorAll("button");
    toggle.onclick = async () => { await api(`/reminders/${r.id}/toggle`, { method: "PATCH" }); loadReminders(); };
    del.onclick = async () => { await api(`/reminders/${r.id}`, { method: "DELETE" }); loadReminders(); };
    root.appendChild(el);
  });
}

document.getElementById("btn-add-rem").onclick = async () => {
  const title = document.getElementById("r-title").value.trim();
  const frequency = document.getElementById("r-freq").value;
  const time_of_day = document.getElementById("r-time").value || null;
  if (!title) return;
  await api("/reminders", { method: "POST", body: JSON.stringify({ title, frequency, time_of_day, active: 1 }) });
  document.getElementById("r-title").value = "";
  loadReminders();
};

// ---------- Init ----------
loadGrocery();
loadExistingPlan();
loadReminders();

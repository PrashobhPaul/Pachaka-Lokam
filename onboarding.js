/* ============================================================================
 * Pachaka Lokam — Onboarding Wizard (v1.0)
 *
 * One-time, 5 step wizard shown to first-time users. All offline. Skippable
 * at every step. Persists results to Store.state and sets state.onboarded
 * so it never re-shows automatically. Re-runnable from Settings.
 *
 * Steps:
 *   1. Region (5 buttons)
 *   2. Diet preference + beverage
 *   3. Festival mode + religious-month chips (Tue/Fri/Sat veg, Shravan, Lent…)
 *   4. Services (maid / milk / newspaper / gas)
 *   5. Quick-stock 12 staples
 * ========================================================================== */

const OB_STAPLES = [
  "Rice", "Toor dal", "Onion", "Tomato", "Coconut", "Milk",
  "Curd", "Coconut oil", "Sugar", "Salt", "Chilli powder", "Tea powder"
];

// Religious-month chips: pre-populate vegRestrictions.days / .months. These
// are the safe weekday-based ones; full date-range support (Lent, Ramadan,
// Karthika) can be layered on later — this is the minimum useful seed.
const OB_DIET_CHIPS = [
  { id: "tue-veg", label: "Veg on Tuesdays", days: [2] },
  { id: "fri-veg", label: "Veg on Fridays", days: [5] },
  { id: "sat-veg", label: "Veg on Saturdays", days: [6] },
];

const Onboarding = {
  step: 1,

  isNeeded() { return !Store.state.onboarded; },

  ensure() {
    if (document.getElementById("onb-modal")) return;
    const html = `
    <div id="onb-modal" class="pl-modal pl-onb" role="dialog" aria-modal="true" aria-labelledby="onb-title">
      <div class="pl-modal-card pl-onb-card">
        <header class="pl-modal-head">
          <h3 id="onb-title">Welcome to Pachaka Lokam</h3>
          <button class="pl-icon-btn" id="onb-skip-all" aria-label="Skip onboarding">Skip</button>
        </header>
        <div class="pl-onb-progress"><div id="onb-bar"></div></div>
        <div class="pl-modal-body" id="onb-body"></div>
        <footer class="pl-modal-foot">
          <button class="btn" id="onb-back">← Back</button>
          <button class="btn primary" id="onb-next">Next →</button>
        </footer>
      </div>
    </div>`;
    document.body.insertAdjacentHTML("beforeend", html);

    document.getElementById("onb-skip-all").onclick = () => this.finish(true);
    document.getElementById("onb-back").onclick = () => this.go(this.step - 1);
    document.getElementById("onb-next").onclick = () => {
      if (this.step >= 5) this.finish(false);
      else this.go(this.step + 1);
    };
  },

  open() {
    this.ensure();
    this.step = 1;
    document.getElementById("onb-modal").classList.add("show");
    this.renderStep();
  },

  go(n) {
    this.step = Math.max(1, Math.min(5, n));
    this.renderStep();
  },

  renderStep() {
    const body = document.getElementById("onb-body");
    const bar  = document.getElementById("onb-bar");
    const back = document.getElementById("onb-back");
    const next = document.getElementById("onb-next");
    bar.style.width = (this.step * 20) + "%";
    back.style.visibility = this.step === 1 ? "hidden" : "visible";
    next.textContent = this.step === 5 ? "Done ✓" : "Next →";

    const s = Store.state.settings;
    const vr = Store.state.vegRestrictions ||= { days: [], months: [] };

    if (this.step === 1) {
      body.innerHTML = `
        <h4>Where do you cook?</h4>
        <p class="hint">Pick your region — meal suggestions and festival calendar follow this.</p>
        <div class="onb-grid">
          ${["Kerala","Tamil Nadu","Andhra Pradesh","Telangana","Karnataka"].map(r => `
            <button class="onb-tile ${s.region === r ? "selected" : ""}" data-region="${r}">
              <div class="onb-tile-emoji">🍛</div>
              <div class="onb-tile-label">${r}</div>
            </button>`).join("")}
        </div>`;
      body.querySelectorAll("[data-region]").forEach(btn => btn.onclick = () => {
        Store.state.settings.region = btn.dataset.region;
        Store.save();
        body.querySelectorAll("[data-region]").forEach(b => b.classList.remove("selected"));
        btn.classList.add("selected");
      });
    }

    else if (this.step === 2) {
      body.innerHTML = `
        <h4>What does your kitchen cook?</h4>
        <p class="hint">We'll bias suggestions to match. You can change this anytime.</p>
        <div class="onb-row">
          <button class="onb-pill ${s.dietPref === "veg" ? "selected" : ""}" data-diet="veg">🌿 Vegetarian</button>
          <button class="onb-pill ${s.dietPref === "egg" ? "selected" : ""}" data-diet="egg">🥚 Egg-only (no meat)</button>
          <button class="onb-pill ${(!s.dietPref || s.dietPref === "nonveg") ? "selected" : ""}" data-diet="nonveg">🍗 Non-vegetarian</button>
        </div>
        <h4 style="margin-top:18px">Tea or coffee?</h4>
        <div class="onb-row">
          <button class="onb-pill ${s.beverage === "tea" ? "selected" : ""}" data-bev="tea">☕ Tea</button>
          <button class="onb-pill ${s.beverage === "coffee" ? "selected" : ""}" data-bev="coffee">☕ Coffee</button>
          <button class="onb-pill ${s.beverage === "either" ? "selected" : ""}" data-bev="either">↔ Either</button>
        </div>`;
      body.querySelectorAll("[data-diet]").forEach(btn => btn.onclick = () => {
        Store.state.settings.dietPref = btn.dataset.diet;
        Store.save();
        body.querySelectorAll("[data-diet]").forEach(b => b.classList.remove("selected"));
        btn.classList.add("selected");
      });
      body.querySelectorAll("[data-bev]").forEach(btn => btn.onclick = () => {
        Store.state.settings.beverage = btn.dataset.bev;
        Store.save();
        body.querySelectorAll("[data-bev]").forEach(b => b.classList.remove("selected"));
        btn.classList.add("selected");
      });
    }

    else if (this.step === 3) {
      body.innerHTML = `
        <h4>Festival meals</h4>
        <p class="hint">When a festival is active, we can replace your meal plan with the traditional menu, just suggest it, or stay quiet.</p>
        <div class="onb-row">
          <button class="onb-pill ${s.festivalMode === "override" ? "selected" : ""}" data-fmode="override">Override meals</button>
          <button class="onb-pill ${s.festivalMode === "suggest" ? "selected" : ""}" data-fmode="suggest">Suggest only</button>
          <button class="onb-pill ${s.festivalMode === "off" ? "selected" : ""}" data-fmode="off">Off</button>
        </div>

        <h4 style="margin-top:18px">Fasting / veg days</h4>
        <p class="hint">We'll auto-skip non-veg suggestions on these days.</p>
        <div class="onb-chips">
          ${OB_DIET_CHIPS.map(c => `
            <label class="onb-chip ${vr.days?.includes(c.days[0]) ? "selected" : ""}">
              <input type="checkbox" data-vchip="${c.id}" ${vr.days?.includes(c.days[0]) ? "checked" : ""}/>
              <span>${c.label}</span>
            </label>`).join("")}
        </div>
        <p class="pl-mini" style="margin-top:14px">More options: month-long fasting periods (Shravan, Karthika, Lent, Ramadan) — set them anytime from Settings → Veg restrictions.</p>`;
      body.querySelectorAll("[data-fmode]").forEach(btn => btn.onclick = () => {
        Store.state.settings.festivalMode = btn.dataset.fmode;
        Store.save();
        body.querySelectorAll("[data-fmode]").forEach(b => b.classList.remove("selected"));
        btn.classList.add("selected");
      });
      body.querySelectorAll("[data-vchip]").forEach(cb => cb.onchange = () => {
        const def = OB_DIET_CHIPS.find(c => c.id === cb.dataset.vchip);
        if (!def) return;
        vr.days ||= [];
        if (cb.checked) {
          def.days.forEach(d => { if (!vr.days.includes(d)) vr.days.push(d); });
        } else {
          vr.days = vr.days.filter(d => !def.days.includes(d));
        }
        Store.save();
        cb.parentElement.classList.toggle("selected", cb.checked);
      });
    }

    else if (this.step === 4) {
      const sv = Store.state.settings.services ||= { maid: true, milk: true, newspaper: true, gas: true };
      body.innerHTML = `
        <h4>What do you track?</h4>
        <p class="hint">Turn off services you don't use — keeps the Reminders tab clean.</p>
        <div class="onb-toggles">
          <label class="onb-toggle ${sv.maid ? "selected" : ""}">
            <input type="checkbox" data-svc="maid" ${sv.maid ? "checked" : ""}/>
            <span>🧹 Maid attendance</span>
          </label>
          <label class="onb-toggle ${sv.milk ? "selected" : ""}">
            <input type="checkbox" data-svc="milk" ${sv.milk ? "checked" : ""}/>
            <span>🥛 Milk delivery</span>
          </label>
          <label class="onb-toggle ${sv.newspaper ? "selected" : ""}">
            <input type="checkbox" data-svc="newspaper" ${sv.newspaper ? "checked" : ""}/>
            <span>📰 Newspaper</span>
          </label>
          <label class="onb-toggle ${sv.gas ? "selected" : ""}">
            <input type="checkbox" data-svc="gas" ${sv.gas ? "checked" : ""}/>
            <span>🔥 Gas cylinder days</span>
          </label>
        </div>`;
      body.querySelectorAll("[data-svc]").forEach(cb => cb.onchange = () => {
        sv[cb.dataset.svc] = cb.checked;
        Store.save();
        cb.parentElement.classList.toggle("selected", cb.checked);
      });
    }

    else if (this.step === 5) {
      const stocked = new Set(Store.state.items.filter(i => i.qty > 0).map(i => i.name));
      body.innerHTML = `
        <h4>Quick stock — what's in your kitchen right now?</h4>
        <p class="hint">Tap the ones you usually have. We'll set them to default quantities so suggestions can start working.</p>
        <div class="onb-grid">
          ${OB_STAPLES.map(name => `
            <button class="onb-tile ${stocked.has(name) ? "selected" : ""}" data-stock="${escapeHtml(name)}">
              <div class="onb-tile-label">${escapeHtml(name)}</div>
            </button>`).join("")}
        </div>
        <p class="pl-mini" style="margin-top:12px">You can always update quantities from the Kitchen tab.</p>`;
      body.querySelectorAll("[data-stock]").forEach(btn => btn.onclick = () => {
        const name = btn.dataset.stock;
        const item = Store.state.items.find(i => i.name === name);
        if (!item) return;
        if (item.qty > 0) {
          item.qty = 0; btn.classList.remove("selected");
        } else {
          item.qty = item.defaultQty; btn.classList.add("selected");
        }
        Store.save();
      });
    }
  },

  finish(skipped) {
    Store.state.onboarded = true;
    Store.state.onboardedAt = new Date().toISOString();
    Store.save();
    document.getElementById("onb-modal").classList.remove("show");
    if (!skipped) toast("All set — your meal suggestions are ready.");
    // Trigger a full refresh so any region/diet/service toggles take effect.
    ["renderToday","renderKitchen","renderGrocery","renderMealsTab",
     "renderReminders","renderFestivalBanner"].forEach(fn => {
      try { window[fn] && window[fn](); } catch {}
    });
  }
};

function initOnboarding() {
  Onboarding.ensure();
  // Auto-open on first run.
  if (Onboarding.isNeeded()) {
    // Slight delay so the splash dismisses and the rest of UI mounts first.
    setTimeout(() => Onboarding.open(), 600);
  }
  // Wire the Settings → Re-run setup button if present.
  const btn = document.getElementById("btn-rerun-onboarding");
  if (btn) btn.onclick = () => Onboarding.open();
}

# Pachaka Lokam 🍲

> **From grocery to meal, simplified.**

Offline-first PWA for Kerala-style family grocery + meal planning. Pure static — no backend, no build step, no database server. All state lives in the device's `localStorage`, so data survives reloads and persists when wrapped as a mobile app.

## Features

- **Grocery Planner** — 8 categories, 49 items pre-seeded per spec (Vegetables, Staples, Non-Veg, Dairy, Oils, Spices, Snacks, Seasonal Fruits), quantity tracking, one-click monthly reset.
- **Meal Planner (Kerala Style)** — 7-day generator honoring spec rules: 80% simple meals, avoids repeating the last 2 picks per slot.
- **Smart Reminders** — daily / weekly / custom, with real OS notifications via the Web Notification API.
- **Installable PWA** — "Add to Home Screen" on Android/iOS, works offline via service worker.

## Run locally

Any static server works. Pick one:

```bash
# Python
python -m http.server 8000

# Node
npx serve .
```

Open http://127.0.0.1:8000

## Deploy to GitHub Pages (free, no card)

1. Push this folder to a new GitHub repo, e.g. `Pachaka-Lokam`.
2. Repo → **Settings** → **Pages** → Source: **Deploy from a branch** → Branch: `main` / `root` → Save.
3. Live at `https://<your-user>.github.io/Pachaka-Lokam/` in ~1 minute.

That's it — same flow as ProfitPilot's frontend.

## Project layout

```
pachaka-lokam/
├── index.html              # App shell
├── app.css                 # Logo-palette theme
├── app.js                  # Controller + state + notifications
├── data.js                 # Seed data (grocery, meals, reminders)
├── manifest.webmanifest    # PWA manifest
├── sw.js                   # Service worker (offline cache)
└── assets/logo.png
```

## Storage model

Everything lives under one `localStorage` key: `pl_state_v1`.

```js
{
  grocery:  [{ id, name, category, qty, checked, seasonal }],
  plans:    { "YYYY-MM-DD": { breakfast, lunch, dinner } },
  reminders:[{ id, title, frequency, time, active }],
  notifiedDates: { "<remId>": "YYYY-MM-DD-HH:MM" }
}
```

To reset entirely: DevTools → Application → Local Storage → delete `pl_state_v1`.

## Mobile wrap (future)

When you wrap this in Capacitor for Android:

- `localStorage` maps to the WebView's persistent storage — no data migration needed.
- Upgrade reminders to `@capacitor/local-notifications` for true background alarms (the current `setInterval` only fires while the tab is open; it's the best the pure-web path allows).
- Service worker becomes optional since Capacitor bundles assets natively.

## Roadmap (spec §6)

- AI meal suggestions (LLM-backed, optional API key in settings)
- Expense tracking
- Multi-user sync (introduce Supabase when needed)
- Background notifications via Capacitor

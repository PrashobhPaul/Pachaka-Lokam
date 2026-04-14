# Pachaka Lokam

**From grocery to meal, simplified.**

Pachaka Lokam (Malayalam: "Kitchen World") is a kitchen management Progressive Web App designed for South Indian households. It connects what's in your kitchen to what you can cook — tracking groceries, suggesting meals based on available ingredients, managing maid/milk/newspaper attendance, and handling festival meal overrides for Kerala, Tamil Nadu, Andhra Pradesh, and Telangana.

---

## Features

### Ingredient-Aware Meal Suggestions
The meal engine matches your pantry against regional recipes in real time. If you have rice, toor dal, and drumstick, it knows you can make sambar. Meals are suggested with an 80% bias toward simple everyday cooking and 20% toward special dishes. Each curry only checks for 1-2 defining main ingredients — staple spices (chilli, curry leaves, mustard, turmeric, cumin, ginger, garlic, oil) are assumed always available and never checked.

### Regional Support (4 States)
- **Kerala** — Sambar, Avial, Thoran, Kaalan, Olan, Erissery, Puttu + Kadala, Appam + Stew, and more
- **Tamil Nadu** — Sambar, Rasam, Kootu, Poriyal, Pongal, Rava Dosa, Chicken Chettinad
- **Andhra Pradesh** — Pappu, Vepudu, Gutti Vankaya, Pesarattu, Pulihora, Fish Pulusu
- **Telangana** — Pappu, Pulusu, Vepudu, Pesarattu + Upma, Natu Kodi Pulusu

All breakfast pairings are authentic (idli pairs with sambar/coconut chutney/groundnut chutney, not random curries). Lunch and dinner are strictly rice-based meals — chapati appears only as a rare substitute.

### Festival Intelligence System
Seven South Indian festivals with three types of meal plan resolution:
- **Progressive** — Multi-day plans where each day has distinct meals (Pongal: Bhogi → Thai Pongal → Mattu Pongal → Kaanum Pongal; Sankranti: Bhogi → Sankranti → Kanuma → Mukkanuma)
- **Pattern** — Template cycling from simple to grand (Onam: 10-day escalation ending in Onasadya; Navaratri: 9-day progression to Vijayadashami; Bathukamma: 9-day Telangana celebration)
- **Static** — Fixed meals for single-day festivals (Vishu: Kanji + Sadya; Ugadi: Pachadi + Bobbatlu)

When a festival is active, a banner appears with the greeting and today's prescribed meals. Users can choose to override regular suggestions, show festival meals as suggestions only, or turn off festival mode entirely.

### Kitchen & Grocery Management
- 71 seeded grocery items across 8 categories (Vegetables, Staples & Pulses, Non-Veg, Dairy & Bakery, Oils, Spices, Snacks, Fruits)
- Update quantities as you use items; mark items as "Out" to move them to the shopping list
- Monthly reset to start fresh; "Bought" action returns items to the kitchen

### Maid, Milk & Newspaper Tracker
Monthly calendar view with tap-to-cycle tracking (blank → present → absent → blank) for three services. Six stat cards show monthly counts at a glance: maid present/absent, milk received/missed, newspaper received/missed.

### Gas Cylinder Tracker
Records when a new gas cylinder was started and shows the running count of days used — helps predict when the next refill is needed.

### Weekly Meal Plan Generator
Generates 7-day plans respecting pantry availability, beverage preference (tea/coffee/either), and the 80/20 simple-to-special ratio. Shows missing ingredients with an "Approve → Grocery" workflow. Plans can be saved as weekly templates and reapplied.

### Smart Reminders
Daily/weekly/custom reminders with browser notification support. Seeded with "Buy Milk" (daily) and "Vegetable Shopping" (weekly).

---

## Architecture

This is a **pure static PWA** — no backend, no framework, no build step.

| Aspect | Detail |
|---|---|
| **Runtime** | Vanilla JavaScript (ES2020+) |
| **State** | localStorage (`pl_state_v5`) |
| **Offline** | Service worker with cache-first strategy |
| **Android** | Ready for Capacitor or TWA conversion |
| **Size** | ~92 KB total (excluding icon) |

### File Structure

```
pachaka-lokam/
├── index.html              # Single-page app shell with 6 tabs
├── data.js                 # Grocery seed, regional curries, meal rules, festival data
├── app.js                  # Store, meal engine, festival service, UI rendering
├── app.css                 # All styles (responsive, mobile-first)
├── sw.js                   # Service worker (cache v3)
├── manifest.webmanifest    # PWA manifest (standalone, portrait)
├── assets/
│   └── logo.png            # App icon (512x512, maskable)
├── CLAUDE.md               # AI assistant context file
└── README.md               # This file
```

### Key Technical Decisions

**Ingredient matching uses exact token matching**, not substring. `pantry.has("rice")` won't falsely match "rice bran oil". The `has()` function lowercases and does `Set.has()` against the pantry.

**Side dishes are resolved dynamically.** Kerala's `withThoran:true` picks from `THORAN_VEG` based on what's in your kitchen. Tamil Nadu's `withPoriyal:true` picks from `PORIYAL_VEG`. AP/Telangana's `withVepudu:true` picks from `VEPUDU_VEG`. Sambar vegetables, avial vegetables, and kootu vegetables each have their own pools.

**Curries use `minFrom`/`minCount` for flexible matching.** Sambar needs toor dal + at least 2 vegetables from `SAMBAR_VEG`. Avial needs coconut + curd + at least 3 from `AVIAL_VEG`. This produces dynamic descriptions like "Sambar (drumstick, carrot)" based on what's actually available.

**Festival resolution is date-driven.** `FestivalService.getActive(region)` checks if today falls within any festival's date range for the selected region, computes the day index, and resolves the meal plan accordingly.

---

## UI Tabs

| Tab | Purpose |
|---|---|
| **Today** | Today's meal suggestions (4 slots), festival override controls, gas cylinder widget |
| **Kitchen** | Pantry inventory grouped by category, quantity adjustments, "Out" to grocery |
| **Grocery** | Shopping list, tap "Bought" to return to kitchen |
| **Meal Plan** | 7-day plan generator, template save/load, missing ingredient approval |
| **Reminders** | Smart reminders + monthly maid/milk/newspaper tracker calendar |
| **Festivals** | All festivals for your region with Live/Upcoming/Past status |

---

## Running Locally

No build step needed. Just serve the files:

```bash
# Python
python3 -m http.server 8080

# Node
npx serve .

# Or simply open index.html in a browser
```

Then open `http://localhost:8080` on your phone or desktop.

---

## Android Conversion

The app is structured for easy Android conversion via two approaches:

### Option A: Capacitor
```bash
npm init -y
npm install @capacitor/core @capacitor/cli
npx cap init "Pachaka Lokam" com.pachakalokam.app --web-dir .
npx cap add android
npx cap sync
npx cap open android
```

### Option B: TWA (Trusted Web Activity)
Deploy to any static host (GitHub Pages, Netlify, Vercel), then wrap with TWA using [Bubblewrap](https://github.com/nicedayfor/nicedayfor.github.io) or Android Studio's TWA template. Requires HTTPS.

---

## Data Model (localStorage)

```javascript
{
  version: 5,
  items: [                    // Kitchen inventory
    { id, name, category, qty, unit, step, defaultQty, seasonal }
  ],
  grocery: ["item_id", ...],  // Items marked "Out"
  plan: [                     // Weekly meal plan
    { date, breakfast, lunch, tea, dinner }
  ],
  todayMeals: {               // Today's selections
    date, breakfast, lunch, tea, dinner
  },
  reminders: [                // Smart reminders
    { id, title, frequency, time, active }
  ],
  tracker: {                  // Maid/Milk/Newspaper attendance
    "2026-04": { "15": { maid, milk, newspaper } }
  },
  settings: {
    region: "Kerala",         // Selected state
    beverage: "tea",          // Tea/Coffee/Either preference
    festivalMode: "override", // override | suggest | off
    newspaper: true           // Newspaper tracking enabled
  },
  gasCylinder: {              // Gas cylinder tracking
    startDate: "2026-04-10"
  },
  weeklyTemplate: null        // Saved weekly plan template
}
```

---

## Regional Curry Catalog

| Region | Curries | Highlights |
|---|---|---|
| **Kerala** | 18 | Sambar, Avial, Thoran (3 variants), Kaalan, Olan, Erissery, Pulissery, Moru Curry, Kootu Curry |
| **Tamil Nadu** | 12 | Sambar, Rasam, Kootu, Poriyal, Vathal Kuzhambu, Mor Kuzhambu, Sundal, Chicken Chettinad |
| **Andhra Pradesh** | 10 | Pappu, Sambar, Rasam, Vepudu, Gutti Vankaya, Tomato Pappu, Fish Pulusu |
| **Telangana** | 9 | Pappu, Pulusu, Rasam, Vepudu, Gutti Vankaya, Natu Kodi Pulusu |

---

## Festival Calendar

| Festival | Region | Duration | Type |
|---|---|---|---|
| Sankranti | AP, Telangana | 4 days (Jan 13-16) | Progressive |
| Pongal | Tamil Nadu | 4 days (Jan 14-17) | Progressive |
| Ugadi | AP, Telangana | 1 day (Mar 29) | Static |
| Vishu | Kerala | 2 days (Apr 14-15) | Static |
| Onam | Kerala | 10 days (Aug 28 - Sep 6) | Pattern |
| Bathukamma | Telangana | 9 days (Oct 2-10) | Pattern |
| Navaratri | All 4 states | 9 days (Oct 11-19) | Pattern |

---

## Contributing

This is a personal/non-profit project. Contributions welcome for:
- Adding more regional curries with authentic pairings
- Expanding to Karnataka and other South Indian regions
- Improving the festival date calculation (currently hardcoded for 2026)
- Better PWA install experience
- UI/UX improvements for the tracker calendar

---

## License

MIT

---

*Built with care for South Indian kitchens.*

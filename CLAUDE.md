This is the working repo of a web app named pachaka lokam which is ment for all the kitchen use form keeping track of grossary items in the the kitchen, updating the to buy list, making meal plans as per the available things and also customising them. It also has reminder system and a system to track the attendence of milk, maid and newspaper. We are now expanding the scope to all south indian states and adding more curries and breakfast options to the list as per state basis. But we keep lunch and dinner to be rice items only as we are making this app mainly for keralites and other south indians

## Architecture
- Pure static PWA (vanilla JS, no framework, no backend)
- All state in localStorage (STORAGE_KEY: "pl_state_v5")
- Offline-first via service worker (sw.js)
- Android-ready via Capacitor/TWA conversion

## File Structure
- index.html — Single page with 6 tabs (Today, Kitchen, Grocery, Meal Plan, Reminders, Festivals)
- data.js — All data: grocery seed, regional curries, meal rules, festival data, reminders
- app.js — Full application logic: store, meal engine, festival service, UI rendering
- app.css — All styles
- sw.js — Service worker for offline cache
- manifest.webmanifest — PWA manifest
- assets/logo.png — App icon

## Key Design Decisions
- Staple spices (chilli, curry leaves, mustard, turmeric, cumin, ginger, garlic, oil) are NEVER checked in ingredient matching — assumed always available
- Curry `needs` arrays contain only DEFINING main ingredients (1-2 items)
- Lunch & dinner = rice-based meals only. Chapati appears as rare substitute (simple:false, special:true)
- Breakfast pairings are authentic South Indian combos (idli+sambar/chutney, dosa+chutney, puttu+kadala, etc.)
- 4 regions: Kerala, Tamil Nadu, Andhra Pradesh, Telangana
- 80% simple meal bias in meal engine
- Festival system supports 3 plan types: progressive, pattern, festival (static)

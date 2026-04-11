# Pachaka Lokam 🍲

> **From grocery to meal, simplified.**

A lightweight FastAPI + SQLite web app for Kerala-style family meal & grocery planning.

## Features

- **Grocery Planner** — monthly reusable checklist, category-based (Vegetables, Staples, Non-Veg, Dairy, Oils, Spices, Snacks, Seasonal Fruits), quantity tracking, one-click monthly reset.
- **Meal Planner (Kerala Style)** — 7-day auto-generator honoring the spec rules: 80% simple meals, avoid repetition of the last 2 picks, seeded with Idli/Dosa/Puttu+Kadala/Sambar-Thoran/Fish Curry/Moru/Dal/Chapati etc.
- **Smart Reminders** — daily milk, weekly vegetables, and custom reminders with toggle/delete.

## Stack

| Layer    | Tech                         |
|----------|------------------------------|
| Backend  | FastAPI (Python 3.10+)       |
| DB       | SQLite (auto-seeded on boot) |
| Frontend | Vanilla JS + Jinja2 (zero build step) |

## Run locally

```bash
python -m venv .venv && source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

Open http://127.0.0.1:8000

## Project layout

```
pachaka-lokam/
├── app/
│   ├── main.py              # FastAPI entry + lifespan seeding
│   ├── db.py                # Schema + seed data from spec
│   ├── routers/
│   │   ├── grocery.py       # CRUD + monthly reset
│   │   ├── meals.py         # Plan generator + persistence
│   │   └── reminders.py     # Reminder CRUD + toggle
│   ├── static/
│   │   ├── css/app.css      # Logo-palette theming
│   │   ├── js/app.js        # SPA controller
│   │   └── img/logo.png
│   └── templates/index.html
├── data/                    # SQLite DB lands here (gitignored)
├── requirements.txt
└── README.md
```

## API quick reference

| Method | Path                         | Purpose                     |
|--------|------------------------------|-----------------------------|
| GET    | `/api/grocery/grouped`       | List items grouped by category |
| POST   | `/api/grocery`               | Add item                    |
| PATCH  | `/api/grocery/{id}`          | Update qty / checked        |
| POST   | `/api/grocery/reset-month`   | Monthly reset               |
| GET    | `/api/meals/catalog`         | Meal catalog                |
| POST   | `/api/meals/generate`        | Generate N-day plan         |
| GET    | `/api/meals/plan`            | Fetch persisted plan        |
| GET/POST/PATCH/DELETE | `/api/reminders` | Reminder CRUD             |

## Roadmap (from spec §6)

- AI meal suggestions (pluggable LLM endpoint)
- Expense tracking
- Multi-user support (auth + scoping)
- Push notifications for reminders

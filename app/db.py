"""SQLite data layer + seed data from the spec document."""
import sqlite3
from pathlib import Path
from contextlib import contextmanager

DB_PATH = Path(__file__).parent.parent / "data" / "pachaka.db"
DB_PATH.parent.mkdir(parents=True, exist_ok=True)


@contextmanager
def get_conn():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    try:
        yield conn
        conn.commit()
    finally:
        conn.close()


SCHEMA = """
CREATE TABLE IF NOT EXISTS grocery_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    quantity REAL DEFAULT 0,
    unit TEXT DEFAULT 'pcs',
    seasonal INTEGER DEFAULT 0,
    checked INTEGER DEFAULT 0,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS meals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    meal_type TEXT NOT NULL,
    simple INTEGER DEFAULT 1
);
CREATE TABLE IF NOT EXISTS meal_plan (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    plan_date TEXT NOT NULL,
    meal_type TEXT NOT NULL,
    meal_id INTEGER REFERENCES meals(id),
    UNIQUE(plan_date, meal_type)
);
CREATE TABLE IF NOT EXISTS reminders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    frequency TEXT NOT NULL,
    time_of_day TEXT,
    active INTEGER DEFAULT 1
);
"""

GROCERY_SEED = [
    ("Vegetables", ["Carrot", "Potato", "Tomato", "Onion", "Ladiesfinger", "Drumstick", "Ginger", "Garlic", "Chilli", "Curry leaves", "Cauliflower", "Cabbage", "Snake gourd", "Pumpkin", "Yam", "Raw mango"]),
    ("Staples & Pulses", ["Rice", "Toor dal", "Moong dal", "Urad dal", "Chana", "Rawa", "Aata", "Sugar", "Salt", "Tea powder"]),
    ("Non-Veg", ["Chicken", "Fish", "Egg"]),
    ("Dairy & Bakery", ["Bread", "Curd", "Milk"]),
    ("Oils", ["Coconut oil", "Rice bran oil"]),
    ("Spices", ["Coconut", "Chilli powder", "Masala powder", "General spices"]),
    ("Snacks", ["Biscuit", "Rusk", "Cookies"]),
    ("Fruits (Seasonal)", ["Banana", "Apple", "Mango", "Grapes", "Pomegranate", "Watermelon", "Kiwi", "Strawberry"]),
]

MEAL_SEED = [
    ("Idli", "breakfast", 1), ("Dosa", "breakfast", 1), ("Upma", "breakfast", 1),
    ("Puttu + Kadala", "breakfast", 1), ("Bread + Egg", "breakfast", 1),
    ("Rice + Sambar + Thoran", "lunch", 1), ("Fish Curry Meals", "lunch", 0),
    ("Moru Curry Meals", "lunch", 1), ("Dal Meals", "lunch", 1),
    ("Chapati + Curry", "dinner", 1), ("Light meals", "dinner", 1), ("Leftovers", "dinner", 1),
]

REMINDER_SEED = [
    ("Buy Milk", "daily", "07:00"),
    ("Vegetable shopping", "weekly", "09:00"),
]


def init_db():
    with get_conn() as c:
        c.executescript(SCHEMA)


def seed_if_empty():
    with get_conn() as c:
        if c.execute("SELECT COUNT(*) FROM grocery_items").fetchone()[0] == 0:
            for cat, items in GROCERY_SEED:
                seasonal = 1 if "Seasonal" in cat else 0
                for it in items:
                    c.execute(
                        "INSERT INTO grocery_items(name,category,seasonal) VALUES(?,?,?)",
                        (it, cat, seasonal),
                    )
        if c.execute("SELECT COUNT(*) FROM meals").fetchone()[0] == 0:
            c.executemany("INSERT INTO meals(name,meal_type,simple) VALUES(?,?,?)", MEAL_SEED)
        if c.execute("SELECT COUNT(*) FROM reminders").fetchone()[0] == 0:
            c.executemany(
                "INSERT INTO reminders(title,frequency,time_of_day) VALUES(?,?,?)",
                REMINDER_SEED,
            )

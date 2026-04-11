from fastapi import APIRouter
from pydantic import BaseModel
from datetime import date, timedelta
import random
from ..db import get_conn

router = APIRouter()


class PlanRequest(BaseModel):
    start_date: str  # YYYY-MM-DD
    days: int = 7


@router.get("/catalog")
def catalog():
    with get_conn() as c:
        rows = c.execute("SELECT * FROM meals ORDER BY meal_type, name").fetchall()
    out: dict = {}
    for r in rows:
        out.setdefault(r["meal_type"], []).append(dict(r))
    return out


@router.post("/generate")
def generate_plan(req: PlanRequest):
    """Generate plan honoring spec rules: 80% simple, avoid repetition."""
    with get_conn() as c:
        catalog_rows = c.execute("SELECT * FROM meals").fetchall()
    by_type: dict = {"breakfast": [], "lunch": [], "dinner": []}
    for r in catalog_rows:
        by_type.setdefault(r["meal_type"], []).append(dict(r))

    start = date.fromisoformat(req.start_date)
    plan = []
    recent: dict = {"breakfast": [], "lunch": [], "dinner": []}

    for i in range(req.days):
        d = (start + timedelta(days=i)).isoformat()
        day_entry = {"date": d, "meals": {}}
        for mt in ("breakfast", "lunch", "dinner"):
            pool = by_type.get(mt, [])
            if not pool:
                continue
            # Avoid repetition: exclude last 2 picks
            available = [m for m in pool if m["id"] not in recent[mt][-2:]] or pool
            # 80% simple rule
            simple = [m for m in available if m["simple"] == 1]
            choice = random.choice(simple) if (simple and random.random() < 0.8) else random.choice(available)
            recent[mt].append(choice["id"])
            day_entry["meals"][mt] = choice["name"]
        plan.append(day_entry)

    # Persist
    with get_conn() as c:
        for day in plan:
            for mt, name in day["meals"].items():
                meal_id = c.execute("SELECT id FROM meals WHERE name=? AND meal_type=?", (name, mt)).fetchone()["id"]
                c.execute(
                    "INSERT OR REPLACE INTO meal_plan(plan_date,meal_type,meal_id) VALUES(?,?,?)",
                    (day["date"], mt, meal_id),
                )
    return {"plan": plan}


@router.get("/plan")
def get_plan(start_date: str, days: int = 7):
    start = date.fromisoformat(start_date)
    end = (start + timedelta(days=days - 1)).isoformat()
    with get_conn() as c:
        rows = c.execute(
            """SELECT mp.plan_date, mp.meal_type, m.name
               FROM meal_plan mp JOIN meals m ON m.id = mp.meal_id
               WHERE mp.plan_date BETWEEN ? AND ?
               ORDER BY mp.plan_date""",
            (start.isoformat(), end),
        ).fetchall()
    out: dict = {}
    for r in rows:
        out.setdefault(r["plan_date"], {})[r["meal_type"]] = r["name"]
    return out

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from ..db import get_conn

router = APIRouter()


class Reminder(BaseModel):
    title: str
    frequency: str  # daily | weekly | custom
    time_of_day: Optional[str] = None
    active: int = 1


@router.get("")
def list_reminders():
    with get_conn() as c:
        return [dict(r) for r in c.execute("SELECT * FROM reminders ORDER BY id").fetchall()]


@router.post("")
def create(r: Reminder):
    with get_conn() as c:
        cur = c.execute(
            "INSERT INTO reminders(title,frequency,time_of_day,active) VALUES(?,?,?,?)",
            (r.title, r.frequency, r.time_of_day, r.active),
        )
        return {"id": cur.lastrowid, **r.model_dump()}


@router.patch("/{rid}/toggle")
def toggle(rid: int):
    with get_conn() as c:
        row = c.execute("SELECT active FROM reminders WHERE id=?", (rid,)).fetchone()
        if not row:
            raise HTTPException(404)
        c.execute("UPDATE reminders SET active=? WHERE id=?", (0 if row["active"] else 1, rid))
    return {"ok": True}


@router.delete("/{rid}")
def delete(rid: int):
    with get_conn() as c:
        c.execute("DELETE FROM reminders WHERE id=?", (rid,))
    return {"ok": True}

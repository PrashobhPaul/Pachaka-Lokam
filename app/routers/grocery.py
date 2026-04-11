from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from ..db import get_conn

router = APIRouter()


class GroceryItem(BaseModel):
    name: str
    category: str
    quantity: float = 0
    unit: str = "pcs"
    seasonal: int = 0


class GroceryUpdate(BaseModel):
    quantity: Optional[float] = None
    checked: Optional[int] = None


@router.get("")
def list_items(category: Optional[str] = None):
    with get_conn() as c:
        if category:
            rows = c.execute("SELECT * FROM grocery_items WHERE category=? ORDER BY name", (category,)).fetchall()
        else:
            rows = c.execute("SELECT * FROM grocery_items ORDER BY category, name").fetchall()
        return [dict(r) for r in rows]


@router.get("/grouped")
def grouped():
    with get_conn() as c:
        rows = c.execute("SELECT * FROM grocery_items ORDER BY category, name").fetchall()
    out: dict = {}
    for r in rows:
        out.setdefault(r["category"], []).append(dict(r))
    return out


@router.post("")
def add_item(item: GroceryItem):
    with get_conn() as c:
        cur = c.execute(
            "INSERT INTO grocery_items(name,category,quantity,unit,seasonal) VALUES(?,?,?,?,?)",
            (item.name, item.category, item.quantity, item.unit, item.seasonal),
        )
        return {"id": cur.lastrowid, **item.model_dump()}


@router.patch("/{item_id}")
def update_item(item_id: int, upd: GroceryUpdate):
    with get_conn() as c:
        row = c.execute("SELECT * FROM grocery_items WHERE id=?", (item_id,)).fetchone()
        if not row:
            raise HTTPException(404)
        q = row["quantity"] if upd.quantity is None else upd.quantity
        ch = row["checked"] if upd.checked is None else upd.checked
        c.execute("UPDATE grocery_items SET quantity=?, checked=? WHERE id=?", (q, ch, item_id))
        return {"ok": True}


@router.delete("/{item_id}")
def delete_item(item_id: int):
    with get_conn() as c:
        c.execute("DELETE FROM grocery_items WHERE id=?", (item_id,))
    return {"ok": True}


@router.post("/reset-month")
def reset_month():
    """Monthly reusable checklist reset: uncheck everything, keep the catalog."""
    with get_conn() as c:
        c.execute("UPDATE grocery_items SET checked=0, quantity=0")
    return {"ok": True}

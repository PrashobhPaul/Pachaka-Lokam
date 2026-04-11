"""Pachaka Lokam — From grocery to meal, simplified."""
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.responses import HTMLResponse
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from pathlib import Path

from .db import init_db, seed_if_empty
from .routers import grocery, meals, reminders

BASE = Path(__file__).parent


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    seed_if_empty()
    yield


app = FastAPI(title="Pachaka Lokam", version="0.1.0", lifespan=lifespan)
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])
app.mount("/static", StaticFiles(directory=BASE / "static"), name="static")
INDEX_HTML = (BASE / "templates" / "index.html").read_text(encoding="utf-8")

app.include_router(grocery.router, prefix="/api/grocery", tags=["grocery"])
app.include_router(meals.router, prefix="/api/meals", tags=["meals"])
app.include_router(reminders.router, prefix="/api/reminders", tags=["reminders"])

# Ensure DB is ready even when lifespan hooks aren't triggered (e.g. test client).
init_db()
seed_if_empty()


@app.get("/", response_class=HTMLResponse)
async def home():
    return HTMLResponse(INDEX_HTML)


@app.get("/health")
async def health():
    return {"status": "ok", "app": "Pachaka Lokam"}

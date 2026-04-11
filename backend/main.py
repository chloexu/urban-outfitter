from dotenv import load_dotenv
load_dotenv(override=False)

import uuid
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from db import init_db
from auth import create_token
import models.profile  # noqa: F401
import models.session  # noqa: F401
import models.result   # noqa: F401
import models.outcome  # noqa: F401
import models.chat_message  # noqa: F401
from routers.profile import router as profile_router
from routers.session import router as session_router
from routers.search import router as search_router
from routers.history import router as history_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    yield


app = FastAPI(title="Urban Outfitter API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(profile_router)
app.include_router(session_router)
app.include_router(search_router)
app.include_router(history_router)


@app.get("/health")
async def health():
    return {"status": "ok"}


@app.post("/auth/token")
async def issue_token():
    """Bootstrap endpoint: issues a token for personal use."""
    return {"token": create_token(user_id=str(uuid.uuid4()))}

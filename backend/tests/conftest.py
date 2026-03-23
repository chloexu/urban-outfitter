# tests/conftest.py
import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.pool import NullPool
from db import Base
import os
from dotenv import load_dotenv

# Import all models so SQLAlchemy registers their tables with Base.metadata
# before create_all is called in the engine fixture.
import models.profile  # noqa: F401
import models.session  # noqa: F401
import models.result   # noqa: F401
import models.outcome  # noqa: F401
import models.chat_message  # noqa: F401

load_dotenv()

TEST_DATABASE_URL = os.environ.get(
    "TEST_DATABASE_URL",
    "postgresql+asyncpg://postgres:postgres@localhost:5432/urban_outfitter_test"
)

# scope="session": create schema once; DDL runs outside any transaction (PostgreSQL autocommits DDL)
@pytest_asyncio.fixture(scope="session")
async def engine():
    eng = create_async_engine(TEST_DATABASE_URL, echo=False, poolclass=NullPool)
    async with eng.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield eng
    async with eng.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    await eng.dispose()

# Per-test isolation via nested transaction (SAVEPOINT), rolled back after each test
@pytest_asyncio.fixture
async def db_session(engine):
    async with engine.connect() as conn:
        await conn.begin()
        async_session = async_sessionmaker(bind=conn, expire_on_commit=False, join_transaction_mode="create_savepoint")
        async with async_session() as session:
            yield session
        await conn.rollback()

@pytest.fixture
def tmp_token():
    from auth import create_token
    return create_token(user_id="test-user-id")

@pytest.fixture
def auth_headers(tmp_token):
    return {"Authorization": f"Bearer {tmp_token}"}

@pytest_asyncio.fixture
async def active_session_id(db_session):
    from models.profile import Profile
    from models.session import Session
    profile = Profile(user_id="test-user-id")
    db_session.add(profile)
    await db_session.flush()
    session = Session(
        profile_id=profile.id,
        mode="form",
        inputs={"category": "tops", "occasion": "work", "colors_liked": ["black"],
                "budget_min": 50, "budget_max": 150, "style_override": []},
        status="active",
    )
    db_session.add(session)
    await db_session.flush()
    return session.id

@pytest_asyncio.fixture
async def closed_session_id(db_session):
    from models.profile import Profile
    from models.session import Session
    from datetime import datetime, timezone
    profile = Profile(user_id="test-closed-user")
    db_session.add(profile)
    await db_session.flush()
    session = Session(
        profile_id=profile.id,
        mode="form",
        inputs={"category": "dresses", "occasion": "evening", "colors_liked": [],
                "budget_min": 80, "budget_max": 200, "style_override": []},
        status="closed",
        closed_at=datetime.now(timezone.utc),
    )
    db_session.add(session)
    await db_session.flush()
    return session.id

@pytest_asyncio.fixture
async def closed_session_fixture(closed_session_id):
    return closed_session_id

@pytest_asyncio.fixture
async def active_chat_session_id(db_session):
    from models.profile import Profile
    from models.session import Session
    profile = Profile(user_id="test-chat-user")
    db_session.add(profile)
    await db_session.flush()
    session = Session(
        profile_id=profile.id,
        mode="chat",
        inputs={},
        status="active",
    )
    db_session.add(session)
    await db_session.flush()
    return session.id

@pytest.fixture
def mock_browser_agent(mocker):
    async def fake_run(self, start_retailer_index=0, start_page=1):
        yield {"type": "progress", "message": "Searching Club Monaco..."}
        yield {"type": "result", "item": {
            "id": "fake-id", "retailer": "Club Monaco",
            "product_name": "Test Blouse", "price": 89.0,
            "image_url": "https://img.test/1.jpg",
            "product_url": "https://clubmonaco.com/blouse",
        }}
        yield {"type": "search_complete", "total": 1}
    mocker.patch("agent.browser_agent.BrowserAgent.run", fake_run)

@pytest_asyncio.fixture
async def client(db_session):
    """AsyncClient with get_db overridden to use the test savepoint session,
    so HTTP-layer endpoints see the same data as fixture setup code."""
    from main import app
    from db import get_db

    async def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
        yield c
    app.dependency_overrides.pop(get_db, None)


@pytest.fixture
def mock_claude(mocker):
    from unittest.mock import MagicMock, AsyncMock
    mock_response = MagicMock()
    mock_response.content = [MagicMock(text="Got it! I'll search for work tops in black, $50-150.")]
    mock_response.stop_reason = "end_turn"
    mocker.patch("agent.llm_chat.anthropic_client.messages.create", new_callable=AsyncMock, return_value=mock_response)
    mocker.patch("agent.similar_brands.anthropic_client.messages.create", new_callable=AsyncMock, return_value=mock_response)

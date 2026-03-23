# Urban Outfitter

A personal AI-powered clothing shopping assistant. Save your brands, colors, and style to a profile — then let an AI browser agent search your favorite retailers and surface only the items that match.

## What it does

Browsing clothing sites means wading through 95% of irrelevant results. Urban Outfitter fixes this by:

1. Storing a style profile (brands, color palette, occasions, size prefs, reference images)
2. Running a headless browser agent (Playwright + Claude) across your saved retailers
3. Streaming back only items that match your profile, in real time

**Starting retailers:** Club Monaco, Lululemon, Max Mara Weekend, Theory, & Other Stories

---

## Architecture

```
Frontend       React Native + Expo (iOS + responsive web)
Backend        FastAPI on Railway (Docker)
Database       PostgreSQL
Agent          Claude claude-sonnet-4-6 + Playwright (headless Chromium)
Real-time      Server-Sent Events (SSE) for streaming results
Auth           Long-lived JWT, no email/password
```

### How a search works

```
User sets session inputs (category, occasion, budget, colors)
        ↓
POST /session  →  session created in DB
        ↓
GET /search/{id}/stream  →  SSE connection opens
        ↓
BrowserAgent launches Playwright, iterates over saved brands
        ↓
Results stream back as SSE events: progress → result → batch_complete
        ↓
After batch of 8: agent pauses, frontend shows "Load More"
        ↓
POST /session/{id}/resume  →  agent picks up from saved state
        ↓
POST /session/{id}/close  →  outcome + rating saved
```

If fewer than 3 results are found, Claude suggests similar brands the user might want to add to their profile.

---

## API

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/health` | Health check |
| `POST` | `/auth/token` | Issue a JWT (personal use bootstrap) |
| `GET` | `/profile` | Fetch profile (auto-created on first call) |
| `PUT` | `/profile` | Update style profile |
| `POST` | `/profile/images` | Upload reference image |
| `POST` | `/session` | Start shopping session (form or chat mode) |
| `POST` | `/session/{id}/resume` | Validate session is resumable for Load More |
| `POST` | `/session/{id}/close` | Close session with outcome + rating |
| `POST` | `/session/{id}/chat` | Send chat message (chat mode) |
| `GET` | `/search/{id}/stream?token=` | SSE stream of results |
| `GET` | `/history` | Paginated past sessions with result counts |

### Session input schema

```json
{
  "mode": "form",
  "inputs": {
    "category": "tops",
    "occasion": "work",
    "colors_liked": ["black", "ivory"],
    "budget_min": 50,
    "budget_max": 150,
    "style_override": []
  }
}
```

Chat mode (`"mode": "chat"`) starts a Claude conversation that resolves to the same inputs schema before triggering the browser agent.

### SSE event types

| Event type | Payload |
|---|---|
| `progress` | `{ message: "Searching Club Monaco..." }` |
| `result` | `{ item: { retailer, product_name, price, image_url, product_url } }` |
| `batch_complete` | `{ count, total_so_far, current_retailer }` |
| `search_complete` | `{ total }` |
| `similar_brands` | `{ brands: ["Banana Republic", ...] }` |
| `error` | `{ message }` |

---

## Project structure

```
backend/
  main.py                    App factory, lifespan, CORS, routers
  db.py                      Async SQLAlchemy engine + Base
  auth.py                    JWT create/verify, get_current_user dep
  routers/
    profile.py               GET /profile, PUT /profile, POST /profile/images
    session.py               POST /session, resume, close, chat
    search.py                GET /search/{id}/stream (SSE)
    history.py               GET /history
  agent/
    browser_agent.py         Playwright orchestrator, SSE yields, batch pagination
    llm_chat.py              Claude chat handler, message logging, input resolution
    similar_brands.py        Claude fallback — suggests similar brands
    retailers/
      base.py                Abstract RetailerAgent base class
      club_monaco.py
      lululemon.py
      max_mara_weekend.py
      theory.py
      other_stories.py
  models/
    profile.py               Profile ORM + Pydantic schemas
    session.py               Session ORM + schemas (incl. SessionInputs)
    result.py                Result ORM + schema
    outcome.py               SessionOutcome ORM + CloseSessionRequest
    chat_message.py          ChatMessage ORM
  tests/
    conftest.py              Fixtures: test DB, client with get_db override, mocks
    test_profile.py
    test_session.py
    test_search.py
    test_history.py
    test_browser_agent.py
    test_llm_chat.py
    test_similar_brands.py
    retailers/               Per-retailer unit tests (mocked Playwright)
```

---

## Local development

### Prerequisites

- Python 3.12+
- PostgreSQL 14+
- An Anthropic API key

### Setup

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
playwright install chromium --with-deps
```

Copy and fill in the env file:

```bash
cp .env.example .env
# Edit .env with your DATABASE_URL, ANTHROPIC_API_KEY, JWT_SECRET
```

### Run

```bash
uvicorn main:app --reload
# → http://localhost:8000
# → http://localhost:8000/docs
```

### Test

```bash
# Create a test database first
createdb urban_outfitter_test

pytest tests/ -v
# 28 tests, all passing
```

---

## Deployment (Railway)

1. Create a Railway project with a PostgreSQL plugin
2. Add a service pointed at this repo (`/backend` root)
3. Set environment variables in Railway dashboard:
   - `DATABASE_URL` (Railway provides this automatically from the Postgres plugin)
   - `ANTHROPIC_API_KEY`
   - `JWT_SECRET`
   - `IMAGES_DIR=/app/uploads`
4. Mount a Railway volume at `/app/uploads` for image persistence
5. Railway builds and runs via the `Dockerfile`

---

## User profile fields

| Field | Type | Description |
|---|---|---|
| `brands` | `text[]` | Ordered list of preferred retailers |
| `colors_liked` | `text[]` | Colors to include in searches |
| `colors_avoided` | `text[]` | Colors always filtered out |
| `style_tags` | `text[]` | Aesthetic descriptors (e.g. "minimalist", "classic") |
| `occasion_prefs` | `text[]` | Default occasions (e.g. "work", "weekend") |
| `reference_image_urls` | `text[]` | Uploaded style reference images |
| `size_prefs` | `jsonb` | Per-category sizes (e.g. `{"tops": "S", "dresses": "4"}`) |
| `budget_defaults` | `jsonb` | Per-category budget ranges |

# Urban Outfitter — Shopping Assistant App

## Context

Browsing clothing websites wastes time filtering out 95% of irrelevant results. This product solves that by pre-saving the user's brands, color palette, style, and occasions to a profile, then using an AI browser agent to search targeted retailer sites on demand — returning only outfits that match. The outcome is a personal shopping assistant that shops like you without requiring you to browse at all.

---

## Decisions Made


| Question                   | Answer                                                                         |
| -------------------------- | ------------------------------------------------------------------------------ |
| Who is it for?             | Personal use (self + close circle)                                             |
| Search mechanism           | AI browser automation (Claude API + Playwright)                                |
| Platform                   | React Native / Expo (iOS + responsive web)                                     |
| Retailers                  | Start with Club Monaco, Lululemon, Max Mara Weekend, Theory, and Other Stories |
| Style profile              | Aesthetic tags + occasion preferences + reference images                       |
| Backend                    | FastAPI on Railway (cloud, always-on)                                          |
| Real-time results          | Server-Sent Events (SSE) for push; HTTP POST for Load More resume              |
| LLM chat profile awareness | Hybrid - starts from profile, user can override mid-chat                       |


---

## System Architecture

Frontend: React Native + Expo (iOS + web browser)
Backend: FastAPI on Railway (containerized via Docker, single instance for personal use)
Database: PostgreSQL (Railway managed)
Agent: Claude API + Playwright (headless Chromium, single concurrent session)
Real-time: SSE for streaming results from agent to frontend

API endpoints:

- GET /profile - Fetch user profile
- PUT /profile - Update user profile
- POST /profile/images - Upload a reference image; returns stored URL
- POST /session - Start a shopping session (body schema defined below)
- POST /session/{id}/resume - Resume agent (triggers next batch for Load More; 422 if session not active or agent_state is null)
- POST /session/{id}/close - Close session with outcome + rating
- GET /search/{session_id}/stream?token={session_token} - SSE stream (auth via query param token since SSE cannot carry Authorization header)
- GET /history - Past sessions list (paginated, 20 per page)

Auth token: a short-lived JWT issued at app launch (stored in AsyncStorage), sent as Bearer token on all endpoints except the SSE stream where it goes in the query string token param.

The Load More flow works as follows: SSE streams results until a batch of 6-8 is complete,
then the agent pauses and sends a "batch_complete" SSE event. The frontend shows "Load More".
When user taps it, the frontend calls POST /session/{id}/resume, which wakes the agent
to continue from its saved state (current retailer + page index stored in DB).

---

## Session Input Schema (contract between frontend and agent)

POST /session request body:
  mode: "form" | "chat"
  inputs:
    category: string              e.g. "tops", "dresses", "trousers"
    occasion: string              e.g. "work", "dinner date", "weekend"
    colors_liked: string[]        optional; overrides profile.colors_liked for this session only
    budget_min: number
    budget_max: number
    style_override: string[]      optional; overrides profile.style_tags for this session only

  profile.colors_avoided always applies regardless of session overrides.
  If colors_liked is omitted, profile.colors_liked is used.

LLM chat mode resolves to the same inputs schema before triggering the agent.

---

## User Profile Structure

Database fields (profiles table):

- id UUID primary key
- brands: text[] (ordered, e.g. ["Club Monaco", "Lululemon", "Max Mara Weekend", "Theory", "& Other Stories"])
- colors_liked: text[] (e.g. ["neutral", "black", "sand", "white", "khaki"])
- colors_avoided: text[](e.g. ["neutral", "pink", "orange", "red"])
- style_tags: text[] (e.g. ["minimalist", "quiet luxury", "office-ready"])
- occasion_prefs: text[]
- reference_image_urls: text[] (up to 10, stored as URLs pointing to uploaded images)
- size_prefs: JSONB  e.g. {"tops": "S", "bottoms": "27", "shoes": "38"}
- budget_defaults: JSONB  e.g. {"tops": {"min": 50, "max": 150}, "dresses": {"min": 80, "max": 200}}
- created_at, updated_at timestamps

Reference images are stored in Railway's persistent volume (or S3-compatible storage if needed).
URLs are internal paths. When passed to the Claude agent, image URLs are included in the
context prompt so Claude can use them as visual style references.

Profile is editable at any time. Mid-session LLM chat overrides are session-scoped
(stored in session.input_overrides JSONB) and do not persist to the saved profile.

Auth: Face ID / PIN lock at app open. Profile stored locally via AsyncStorage as a
local-first cache, synced to backend. No email/password. Recovery is via iCloud backup
of the Expo app's local storage (acceptable for personal use).

---

## Shopping Session Flow

### Mode 1 — Form UX (fastest path)

Dropdowns and sliders pre-filled from profile defaults:

- Category (tops, bottoms, dresses, outerwear, shoes, accessories)
- Occasion (from profile occasion_prefs + "other")
- Color (defaults to profile colors_liked, user can override per session)
- Budget slider (min/max, pre-filled from budget_defaults for selected category)
- Style vibe tags (defaults to profile style_tags, user can deselect or add)

Tap "Start Searching" -> POST /session -> SSE stream opens.

### Mode 2 — LLM Chat UX (conversational)

Assistant opens knowing the user's profile:
  "Hey! Your go-to brands are Club Monaco, Lululemon, Max Mara Weekend, Theory, and Other Stories. What are you shopping for today?"

User describes in natural language. Claude asks follow-up questions if inputs are incomplete.
Once Claude has all required session inputs (category, occasion, color, budget), it confirms:
  "Got it — I'll search for minimalist dinner dresses in ivory or navy, $80-150, across your brands."
User confirms -> same POST /session call with resolved inputs.

Overrides: if user says "show me something more colorful" mid-chat, Claude notes this as
a session-scoped override (stored in session.input_overrides). Profile is not modified.

Chat history logging: every message turn (role: user | assistant, content, timestamp) is
persisted to the chat_messages table keyed by session_id. This enables future eval against
session ratings and feedback to identify patterns in chat quality and agent accuracy.

---

## AI Browser Agent Behavior

Input: full profile + session inputs schema (defined above)

For each retailer in the user's brands list (in order):

1. Navigate to retailer website
2. Apply filters using native site UI: category, color, price range
3. Scroll and scan results; score each item against style_tags, occasion, reference images
4. Extract per item: product_name, price (number), image_url, product_url, retailer
5. Stream each qualifying item immediately via SSE

SSE event types:

- { type: "progress", message: "Searching Club Monaco..." }
- { type: "result", item: { product_name, price, image_url, product_url, retailer } }
- { type: "batch_complete", count: 8, total_so_far: 8, current_retailer: "Club Monaco" }
- { type: "search_complete", total: 14 }
- { type: "error", message: "...", retailer: "Theory" }

Agent state persisted in sessions table (agent_state JSONB):

- current_retailer_index, current_page, items_found_so_far
Allows resume after batch_complete when user taps Load More.

Timeout: 90 seconds per retailer. If exceeded, emit { type: "error" } event for that retailer and continue to next.

Bot detection / CAPTCHA: if Playwright encounters a CAPTCHA or block, emit error event for
that retailer ("Site blocked automated access") and skip to next brand. Do not retry.
User sees a message: "Club Monaco blocked the search — try opening Club Monaco manually."

Concurrency: single session at a time for personal use. If a session is already active,
backend returns 409 Conflict with message "A shopping session is already running."

Starting retailer list and their known filter URL patterns:

- Club Monaco: clubmonaco.com
- Lululemon: lululemon.com
- Max Mara Weekend: maxmara.com (Weekend line)
- Theory: theory.com
- & Other Stories: stories.com
Agent must handle site-specific navigation per retailer.

Fallback — Similar Brands:
Triggered when total results across ALL retailers combined < 3 at search_complete event.
Per-retailer failures (bot block, timeout) do not trigger fallback on their own.
Claude (no browser) generates 2-3 brand suggestions with similar aesthetic and price range.
Displayed as a card below results: "You might also like: Banana Republic, J.Crew, Reiss"
Each suggestion is a tappable link to the brand's website homepage.

---

## Results Screen

2-column grid layout:

- Each card: product image (full width), brand name, price, tap -> opens product URL in browser
- Status bar: "14 outfits found across 3 brands"
- Load More button: visible when batch_complete event received and search not yet complete
- "Search complete" indicator when search_complete event received
- Error inline notices: "Club Monaco blocked — [Open Club Monaco]" shown as a dismissible banner

Individual garments only (not composed full outfits). "Outfits" = individual clothing items.

---

## Session Close Flow

Triggered when user taps "Close Session" (available once at least 1 result has loaded):

Step 1: Did you buy something? [Yes] [No, keep browsing] [No, done]
Step 2 (if Yes): Was it from a link I found?

- [Yes - select item from results list]
- [No, found it elsewhere] -> show optional text field: "Paste the link to what you bought"
(used later to suggest profile refinements; e.g. if user repeatedly buys from brands
outside their saved list, the app can suggest adding that brand to their profile)
Step 3: Rate your experience (1-5 stars, required)
Step 4: Any feedback? (free-form text, optional, max 500 chars)
 Placeholder: "e.g. results were too casual for the occasion"

Step 5: [Close Session] button -> POST /session/{id}/close

---

## Database Schema

profiles
  id UUID PK, brands TEXT[], colors_liked TEXT[], colors_avoided TEXT[]
  style_tags TEXT[], occasion_prefs TEXT[], reference_image_urls TEXT[]
  size_prefs JSONB, budget_defaults JSONB, created_at, updated_at

sessions
  id UUID PK, profile_id UUID FK, mode TEXT (form|chat)
  inputs JSONB, input_overrides JSONB, status TEXT (active|closed)
  agent_state JSONB, started_at, closed_at

results
  id UUID PK, session_id UUID FK, retailer TEXT, product_name TEXT
  price NUMERIC, image_url TEXT, product_url TEXT, batch_index INT, created_at

session_outcomes  (not "purchases" — covers no-purchase sessions too)
  id UUID PK, session_id UUID FK (unique)
  made_purchase BOOL, from_results BOOL (nullable)
  result_id UUID FK (nullable)         -- set when purchase was from app results
  external_purchase_url TEXT (nullable) -- set when purchase was found elsewhere; used for future profile suggestions
  rating INT (1-5), feedback TEXT, created_at
  Note: result_id is a single FK — v1 supports recording one purchased item per session.
  Multi-item purchase tracking is out of scope for v1.

chat_messages  (LLM chat history for eval)
  id UUID PK, session_id UUID FK
  role TEXT (user|assistant), content TEXT
  turn_index INT, created_at
  Used for: eval of chat quality against session ratings/feedback; profile suggestion improvements.

Known limitation: device recovery relies on iCloud backup of AsyncStorage.
If the user switches to Android or uses web-only, the local token is lost and
the profile must be re-entered manually. Acceptable for personal use in v1.

---

## App Navigation

Bottom tab bar:

- Home: "Start Shopping" CTA, mode picker (Form / Chat), last 3 sessions summary
- Search: live search progress (SSE feed) + paginated results grid + similar brands card
- Profile: edit all profile fields
- History: past sessions list; each row shows date, category searched, result count,
     purchase made (icon), rating stars

Auth: Face ID / PIN. App stores profile locally (AsyncStorage) and syncs to backend.
For "close circle" use: each user runs their own backend instance or shares the single
Railway deployment with a shared profile (multi-profile support is out of scope for v1).

---

## Tech Stack

Frontend:

- React Native + Expo SDK
- expo-router (file-based routing, tab navigator)
- react-native-sse or EventSource polyfill for SSE
- AsyncStorage for local profile cache

Backend:

- Python 3.12 / FastAPI
- asyncpg + SQLAlchemy 2.0 (async) for PostgreSQL
- Playwright (async) with headful=False, single browser instance
- Anthropic Python SDK for Claude API (claude-sonnet-4-6)
- Docker container on Railway

Infrastructure:

- Railway: one web service (FastAPI + Playwright), one PostgreSQL database
- Railway persistent volume for reference images uploaded by user via POST /profile/images
(product image_url fields point to external retailer CDN, not stored locally)
- If reference image storage exceeds 1GB, migrate to Cloudflare R2

---

## Project File Structure

urban-outfitter/
  backend/
    Dockerfile
    requirements.txt
    main.py                      FastAPI app, lifespan, CORS
    routers/
      profile.py                 GET/PUT /profile
      session.py                 POST /session, /session/{id}/resume, /session/{id}/close
      search.py                  GET /search/{session_id}/stream (SSE)
      history.py                 GET /history
    agent/
      browser_agent.py           Playwright navigation + item extraction per retailer
      llm_chat.py                Claude chat turn handler, profile-aware, resolves to inputs
      retailers/
        club_monaco.py           Site-specific navigation logic for Club Monaco
        lululemon.py
        max_mara_weekend.py
        theory.py
        other_stories.py
    models/
      profile.py                 Pydantic schemas + ORM model
      session.py
      result.py
      outcome.py
      chat_message.py            Chat turn ORM model + schema
    db.py                        Async engine, session factory, migration helper
  frontend/
    app/
      (tabs)/
        index.tsx                Home screen
        search.tsx               Active session + results
        profile.tsx              Profile editor
        history.tsx              Session history
    components/
      SessionForm.tsx            Form UX input mode
      SessionChat.tsx            LLM chat UX input mode
      ResultCard.tsx             Single outfit result card
      ResultsGrid.tsx            Paginated 2-col results grid with Load More
      SessionClose.tsx           Close flow: purchase + rating + feedback
      SimilarBrands.tsx          Fallback brand suggestion card
      SearchProgress.tsx         Live SSE progress feed
    hooks/
      useSSE.ts                  SSE connection, event parsing, reconnect logic
      useProfile.ts              Profile fetch/update + AsyncStorage cache
      useSession.ts              Session state, resume, close

---

## Verification

1. Run backend: docker build + uvicorn main:app --reload; confirm all endpoints return expected shapes
2. Run frontend: npx expo start; confirm tab navigation renders on iOS Simulator and web
3. Create profile via Profile tab; confirm saved to PostgreSQL profiles table
4. Start form-mode session; confirm SSE stream fires, result cards appear in real-time
5. Start chat-mode session; confirm Claude references saved profile brands in first message
6. Test Load More: confirm agent resumes after POST /session/{id}/resume and new batch streams
7. Simulate bot block on one retailer; confirm error banner appears and other retailers continue
8. Trigger <3 results; confirm Similar Brands card appears with 2-3 suggestions
9. Close session with Yes/purchase/result selection + 3-star rating; confirm session_outcomes row
10. Close a different session with Yes/purchased elsewhere + paste external URL; confirm external_purchase_url saved
11. Open a chat-mode session, exchange 3 turns; confirm all turns persisted in chat_messages table with correct role/turn_index
12. Check History tab shows the closed session with correct result count, purchase icon, stars


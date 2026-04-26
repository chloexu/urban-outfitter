# Urban Outfitter — Future Roadmap

Ideas for future phases. Each phase should get its own design spec and implementation plan before building.

---

## Phase A — Visual Results

**Problem:** Results currently show product name + a link with no images or prices. `image_url` and `price` exist in the schema but come back empty from the Google agent. Clicking "View →" is a leap of faith — there's no way to evaluate an item without leaving the app.

**What to build:**
- Real product images and prices surfaced in result cards
- Options: scrape product page with Playwright to extract image/price after Google finds the URL; or use a product data API (e.g. SerpAPI Shopping, Rainforest API)
- The result card UI already has `image_url` and `price` fields — backend just needs to populate them

**Why it matters:** Visual browsing is the whole experience. Without images, the results are barely more useful than a list of links.

---

## Phase B — Profile Learning from Outcomes

**Problem:** Outcome data (rating 1–5, made_purchase, feedback text) is collected after every session but never used. The assistant never gets smarter — a 5-star purchase and a 1-star miss look identical to the system on the next run.

**What to build:**
- After a session closes with a high rating or purchase, extract style signals from the bought/liked item (retailer, category, colors, style descriptors) and reinforce them in the profile
- After a low rating, extract what missed and add to a `negative_signals` profile field
- A lightweight Claude call: "given this outcome and item, what profile attributes should be strengthened or weakened?"
- Profile update is proposed to the user for approval (HITL) before being written

**Why it matters:** This is what makes it a *personal* assistant over time rather than a static filter. Without it, the profile is manually curated forever.

---

## Phase C — Saved Items / Wishlist

**Problem:** Results are ephemeral — if you close the app, items you saw but didn't buy are gone. The `results` table in the DB stores everything, but there's no save/bookmark concept exposed to the user.

**What to build:**
- Save button on each result card
- Saved items screen (or section in History) showing bookmarked items across sessions
- `saved` boolean flag on the `results` model, or a separate `saved_items` join table
- Saved items should show image, price, retailer, and direct link
- Optional: mark saved items as "purchased" or "not interested" to feed Phase B signals

**Why it matters:** Shopping is rarely a single-session decision. Saves bridge the gap between "I saw this" and "I'm ready to buy."

---

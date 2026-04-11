import asyncio
import logging
import re
from urllib.parse import urlencode
from typing import AsyncGenerator
from playwright.async_api import async_playwright

logger = logging.getLogger(__name__)

STEALTH_ARGS = [
    "--disable-blink-features=AutomationControlled",
    "--no-sandbox",
    "--disable-dev-shm-usage",
]

STEALTH_UA = (
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
    "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
)

WEBDRIVER_PATCH = "Object.defineProperty(navigator, 'webdriver', {get: () => undefined})"


def _build_query(brand: str, category: str, occasion: str, budget_min: float, budget_max: float) -> str:
    parts = [brand, "women", category]
    if occasion and occasion not in ("other", ""):
        parts.append(occasion)
    parts.append(f"under {int(budget_max)} dollars")
    return " ".join(parts)


class GoogleSearchAgent:
    def __init__(self, profile: dict, inputs: dict, session_id: str):
        self.profile = profile
        self.inputs = inputs
        self.session_id = session_id

    async def run(self) -> AsyncGenerator[dict, None]:
        brands = self.profile.get("brands", [])
        category = self.inputs.get("category", "clothing")
        occasion = self.inputs.get("occasion", "")
        budget_min = self.inputs.get("budget_min", 0)
        budget_max = self.inputs.get("budget_max", 500)
        total_found = 0

        logger.info("GoogleSearchAgent starting | session=%s brands=%s", self.session_id, brands)

        pw = await async_playwright().start()
        browser = await pw.chromium.launch(headless=True, args=STEALTH_ARGS)
        try:
            ctx = await browser.new_context(
                user_agent=STEALTH_UA,
                locale="en-US",
                viewport={"width": 1280, "height": 800},
            )
            await ctx.add_init_script(WEBDRIVER_PATCH)
            page = await ctx.new_page()

            for brand in brands:
                query = _build_query(brand, category, occasion, budget_min, budget_max)
                logger.info("GoogleSearchAgent querying: %s", query)
                yield {"type": "progress", "message": f"Searching {brand}..."}

                try:
                    search_url = "https://www.google.com/search?" + urlencode({"q": query})
                    await page.goto(search_url, timeout=30_000)
                    await asyncio.sleep(2)  # wait for JS-rendered results

                    # Match brand domain loosely
                    brand_slug = brand.lower().replace(" ", "").replace("&", "").replace("'", "").replace("-", "")

                    seen = set()
                    anchors = await page.query_selector_all(f"a[href*='{brand_slug}'], a[href*='{brand.lower().replace(' ', '-')}']")
                    logger.info("GoogleSearchAgent brand=%s links_found=%d", brand, len(anchors))

                    for anchor in anchors:
                        href = await anchor.get_attribute("href") or ""
                        if not href.startswith("http"):
                            continue
                        # Skip non-product pages
                        if re.search(r"/(cart|account|help|login|register|checkout)(/|$)", href):
                            continue
                        if href in seen:
                            continue
                        seen.add(href)

                        text = (await anchor.inner_text()).strip()
                        text = text.split("\n")[0].strip()[:120]
                        if not text or len(text) < 4:
                            # Extract product name from URL path segment before query string
                            path = href.split("?")[0].rstrip("/")
                            slug = path.split("/")[-1]
                            # Skip hash-like slugs (prod12345 style)
                            if re.match(r"^(prod|_)\d+", slug.lower()):
                                parts = path.split("/")
                                slug = next((p for p in reversed(parts) if not re.match(r"^(prod|_|p$)", p.lower())), slug)
                            text = slug.replace("-", " ").replace("_", " ").title()

                        total_found += 1
                        yield {
                            "type": "result",
                            "item": {
                                "retailer": brand,
                                "product_name": text,
                                "price": 0,
                                "image_url": "",
                                "product_url": href,
                            },
                        }

                        if len(seen) >= 5:  # cap per brand
                            break

                except Exception as e:
                    logger.error("GoogleSearchAgent error for brand %s: %s", brand, e)
                    yield {"type": "error", "message": str(e), "retailer": brand}

            logger.info("GoogleSearchAgent done | session=%s total=%d", self.session_id, total_found)
            yield {"type": "search_complete", "total": total_found}

        finally:
            await browser.close()
            await pw.stop()

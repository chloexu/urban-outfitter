import logging
from typing import AsyncGenerator
from playwright.async_api import async_playwright
from agent.retailers.base import RetailerAgent

logger = logging.getLogger(__name__)
from agent.retailers.club_monaco import ClubMonacoAgent
from agent.retailers.lululemon import LululemonAgent
from agent.retailers.max_mara_weekend import MaxMaraWeekendAgent
from agent.retailers.theory import TheoryAgent
from agent.retailers.other_stories import OtherStoriesAgent

RETAILER_MAP: dict[str, type[RetailerAgent]] = {
    "club monaco": ClubMonacoAgent,
    "lululemon": LululemonAgent,
    "max mara weekend": MaxMaraWeekendAgent,
    "theory": TheoryAgent,
    "& other stories": OtherStoriesAgent,
    "other stories": OtherStoriesAgent,
}

BATCH_SIZE = 8


def get_retailer_agent(brand_name: str, page) -> type[RetailerAgent] | None:
    return RETAILER_MAP.get(brand_name.lower().strip(), None)


class BrowserAgent:
    def __init__(self, profile: dict, inputs: dict, session_id: str):
        self.profile = profile
        self.inputs = inputs
        self.session_id = session_id
        self.batch_index = 0
        self.total_found = 0

    def _effective_colors(self) -> list[str]:
        return self.inputs.get("colors_liked") or self.profile.get("colors_liked", [])

    def _effective_styles(self) -> list[str]:
        return self.inputs.get("style_override") or self.profile.get("style_tags", [])

    async def run(self, start_retailer_index: int = 0, start_page: int = 1) -> AsyncGenerator[dict, None]:
        brands = self.profile.get("brands", [])
        colors = self._effective_colors()
        styles = self._effective_styles()
        avoided = self.profile.get("colors_avoided", [])
        batch_count = 0

        logger.info("BrowserAgent starting | session=%s brands=%s inputs=%s", self.session_id, brands, self.inputs)
        pw = await async_playwright().start()
        browser = await pw.chromium.launch(headless=True)
        try:
            page = await browser.new_page()

            for i, brand in enumerate(brands[start_retailer_index:], start=start_retailer_index):
                AgentClass = get_retailer_agent(brand, page)
                if not AgentClass:
                    logger.info("BrowserAgent skipping brand (no agent): %s", brand)
                    continue

                logger.info("BrowserAgent searching brand: %s", brand)
                yield {"type": "progress", "message": f"Searching {brand}..."}
                agent = AgentClass(page=page)

                try:
                    async for item in agent.search(
                        category=self.inputs["category"],
                        colors=colors,
                        budget_min=self.inputs["budget_min"],
                        budget_max=self.inputs["budget_max"],
                        style_tags=styles,
                        occasion=self.inputs["occasion"],
                    ):
                        if any(c.lower() in item["product_name"].lower() for c in avoided):
                            continue

                        self.total_found += 1
                        batch_count += 1
                        item["id"] = str(__import__("uuid").uuid4())
                        yield {"type": "result", "item": item}

                        if batch_count >= BATCH_SIZE:
                            yield {
                                "type": "batch_complete",
                                "count": batch_count,
                                "total_so_far": self.total_found,
                                "current_retailer": brand,
                            }
                            # Pause — browser is closed here; SSE endpoint saves agent_state.
                            # Client calls /session/{id}/resume to validate, then reconnects to SSE.
                            # The SSE endpoint re-instantiates BrowserAgent with saved state.
                            return

                except Exception as e:
                    logger.error("BrowserAgent error for brand %s: %s", brand, e, exc_info=True)
                    yield {"type": "error", "message": str(e), "retailer": brand}

            logger.info("BrowserAgent search_complete | session=%s total=%d", self.session_id, self.total_found)
            yield {"type": "search_complete", "total": self.total_found}
        finally:
            await browser.close()
            await pw.stop()

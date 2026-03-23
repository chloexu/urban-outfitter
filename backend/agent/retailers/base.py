from abc import ABC, abstractmethod
from typing import AsyncGenerator
from playwright.async_api import Page


class RetailerAgent(ABC):
    RETAILER_NAME: str = ""
    TIMEOUT_MS: int = 90_000

    def __init__(self, page: Page):
        self.page = page

    @abstractmethod
    async def search(
        self,
        category: str,
        colors: list[str],
        budget_min: float,
        budget_max: float,
        style_tags: list[str],
        occasion: str,
        page_num: int = 1,
    ) -> AsyncGenerator[dict, None]:
        """Yield result dicts: {retailer, product_name, price, image_url, product_url}"""
        ...

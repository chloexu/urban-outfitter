from typing import AsyncGenerator
from .base import RetailerAgent


class ClubMonacoAgent(RetailerAgent):
    RETAILER_NAME = "Club Monaco"
    BASE_URL = "https://www.clubmonaco.com"

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
        category_paths = {
            "tops": "/en-ca/women/clothing/tops",
            "dresses": "/en-ca/women/clothing/dresses",
            "bottoms": "/en-ca/women/clothing/pants",
            "outerwear": "/en-ca/women/clothing/coats-jackets",
        }
        path = category_paths.get(category, "/en-ca/women/clothing")
        url = f"{self.BASE_URL}{path}?start={(page_num - 1) * 24}"

        await self.page.goto(url, timeout=self.TIMEOUT_MS)
        await self.page.wait_for_selector(".product-tile", timeout=10_000)

        items = await self.page.query_selector_all(".product-tile")
        for item in items:
            try:
                name_el = await item.query_selector(".product-name")
                price_el = await item.query_selector(".price-sales")
                img_el = await item.query_selector("img")
                link_el = await item.query_selector("a")

                if not all([name_el, price_el, img_el, link_el]):
                    continue

                name = await name_el.inner_text()
                price_text = await price_el.inner_text()
                price = float(price_text.replace("$", "").replace(",", "").strip())
                image_url = await img_el.get_attribute("src") or ""
                product_url = await link_el.get_attribute("href") or ""
                if product_url.startswith("/"):
                    product_url = self.BASE_URL + product_url

                if not (budget_min <= price <= budget_max):
                    continue

                yield {
                    "retailer": self.RETAILER_NAME,
                    "product_name": name.strip(),
                    "price": price,
                    "image_url": image_url,
                    "product_url": product_url,
                }
            except Exception:
                continue

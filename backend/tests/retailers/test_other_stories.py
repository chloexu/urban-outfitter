import pytest
from unittest.mock import AsyncMock
from agent.retailers.other_stories import OtherStoriesAgent


def _make_mock_item(name: str, price_str: str, image_url: str, href: str):
    mock_item = AsyncMock()

    async def mock_query_selector(sel):
        el = AsyncMock()
        if "product-item-name" in sel:
            el.inner_text = AsyncMock(return_value=name)
        elif "product-price" in sel:
            el.inner_text = AsyncMock(return_value=price_str)
        elif "img" in sel:
            el.get_attribute = AsyncMock(return_value=image_url)
        else:
            el.get_attribute = AsyncMock(return_value=href)
        return el

    mock_item.query_selector = mock_query_selector
    return mock_item


@pytest.mark.asyncio
async def test_other_stories_yields_results_in_budget():
    mock_page = AsyncMock()
    mock_page.goto = AsyncMock()
    mock_page.wait_for_selector = AsyncMock()

    mock_item = _make_mock_item("Linen Shirt", "$59", "https://img.stories.com/1.jpg", "/en_eur/clothing/tops/shirt")
    mock_page.query_selector_all = AsyncMock(return_value=[mock_item])

    agent = OtherStoriesAgent(page=mock_page)
    results = []
    async for item in agent.search(
        category="tops", colors=["white"], budget_min=30, budget_max=100,
        style_tags=["casual"], occasion="weekend"
    ):
        results.append(item)

    assert len(results) == 1
    assert results[0]["retailer"] == "& Other Stories"
    assert results[0]["price"] == 59.0
    assert results[0]["product_url"].startswith("https://www.stories.com")


@pytest.mark.asyncio
async def test_other_stories_filters_out_of_budget():
    mock_page = AsyncMock()
    mock_page.goto = AsyncMock()
    mock_page.wait_for_selector = AsyncMock()

    mock_item = _make_mock_item("Leather Jacket", "$350", "https://img.stories.com/2.jpg", "/jacket")
    mock_page.query_selector_all = AsyncMock(return_value=[mock_item])

    agent = OtherStoriesAgent(page=mock_page)
    results = [item async for item in agent.search(
        category="outerwear", colors=["black"], budget_min=30, budget_max=100,
        style_tags=[], occasion="weekend"
    )]
    assert len(results) == 0

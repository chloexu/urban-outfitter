import pytest
from unittest.mock import AsyncMock
from agent.retailers.club_monaco import ClubMonacoAgent


def _make_mock_item(name: str, price_str: str, image_url: str, href: str):
    mock_item = AsyncMock()

    async def mock_query_selector(sel):
        el = AsyncMock()
        if "product-name" in sel:
            el.inner_text = AsyncMock(return_value=name)
        elif "price-sales" in sel:
            el.inner_text = AsyncMock(return_value=price_str)
        elif "img" in sel:
            el.get_attribute = AsyncMock(return_value=image_url)
        else:  # link
            el.get_attribute = AsyncMock(return_value=href)
        return el

    mock_item.query_selector = mock_query_selector
    return mock_item


@pytest.mark.asyncio
async def test_club_monaco_yields_results_in_budget():
    mock_page = AsyncMock()
    mock_page.goto = AsyncMock()
    mock_page.wait_for_selector = AsyncMock()

    mock_item = _make_mock_item("Silk Blouse", "$89", "https://img.clubmonaco.com/1.jpg", "/products/silk-blouse")
    mock_page.query_selector_all = AsyncMock(return_value=[mock_item])

    agent = ClubMonacoAgent(page=mock_page)
    results = []
    async for item in agent.search(
        category="tops", colors=["black"], budget_min=50, budget_max=150,
        style_tags=["minimalist"], occasion="work"
    ):
        results.append(item)

    assert len(results) == 1
    assert results[0]["retailer"] == "Club Monaco"
    assert results[0]["price"] == 89.0
    assert results[0]["product_url"].startswith("https://www.clubmonaco.com")


@pytest.mark.asyncio
async def test_club_monaco_filters_out_of_budget():
    mock_page = AsyncMock()
    mock_page.goto = AsyncMock()
    mock_page.wait_for_selector = AsyncMock()

    mock_item = _make_mock_item("Expensive Coat", "$500", "https://img.clubmonaco.com/2.jpg", "/coat")
    mock_page.query_selector_all = AsyncMock(return_value=[mock_item])

    agent = ClubMonacoAgent(page=mock_page)
    results = [item async for item in agent.search(
        category="tops", colors=["black"], budget_min=50, budget_max=150,
        style_tags=[], occasion="work"
    )]
    assert len(results) == 0

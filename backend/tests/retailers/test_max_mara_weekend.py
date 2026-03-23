import pytest
from unittest.mock import AsyncMock
from agent.retailers.max_mara_weekend import MaxMaraWeekendAgent


def _make_mock_item(name: str, price_str: str, image_url: str, href: str):
    mock_item = AsyncMock()

    async def mock_query_selector(sel):
        el = AsyncMock()
        if "product-title" in sel:
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
async def test_max_mara_weekend_yields_results_in_budget():
    mock_page = AsyncMock()
    mock_page.goto = AsyncMock()
    mock_page.wait_for_selector = AsyncMock()

    mock_item = _make_mock_item("Weekend Blouse", "$280", "https://img.maxmara.com/1.jpg", "/us/women/tops/blouse")
    mock_page.query_selector_all = AsyncMock(return_value=[mock_item])

    agent = MaxMaraWeekendAgent(page=mock_page)
    results = []
    async for item in agent.search(
        category="tops", colors=["ivory"], budget_min=100, budget_max=400,
        style_tags=["classic"], occasion="work"
    ):
        results.append(item)

    assert len(results) == 1
    assert results[0]["retailer"] == "Max Mara Weekend"
    assert results[0]["price"] == 280.0


@pytest.mark.asyncio
async def test_max_mara_weekend_filters_out_of_budget():
    mock_page = AsyncMock()
    mock_page.goto = AsyncMock()
    mock_page.wait_for_selector = AsyncMock()

    mock_item = _make_mock_item("Luxury Coat", "$1200", "https://img.maxmara.com/2.jpg", "/coat")
    mock_page.query_selector_all = AsyncMock(return_value=[mock_item])

    agent = MaxMaraWeekendAgent(page=mock_page)
    results = [item async for item in agent.search(
        category="outerwear", colors=["black"], budget_min=100, budget_max=500,
        style_tags=[], occasion="work"
    )]
    assert len(results) == 0

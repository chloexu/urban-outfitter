import pytest
from unittest.mock import AsyncMock
from agent.retailers.theory import TheoryAgent


def _make_mock_item(name: str, price_str: str, image_url: str, href: str):
    mock_item = AsyncMock()

    async def mock_query_selector(sel):
        el = AsyncMock()
        if "product-item__title" in sel:
            el.inner_text = AsyncMock(return_value=name)
        elif "product-item__price" in sel:
            el.inner_text = AsyncMock(return_value=price_str)
        elif "img" in sel:
            el.get_attribute = AsyncMock(return_value=image_url)
        else:
            el.get_attribute = AsyncMock(return_value=href)
        return el

    mock_item.query_selector = mock_query_selector
    return mock_item


@pytest.mark.asyncio
async def test_theory_yields_results_in_budget():
    mock_page = AsyncMock()
    mock_page.goto = AsyncMock()
    mock_page.wait_for_selector = AsyncMock()

    mock_item = _make_mock_item("Silk Shell", "$195", "https://img.theory.com/1.jpg", "/products/silk-shell")
    mock_page.query_selector_all = AsyncMock(return_value=[mock_item])

    agent = TheoryAgent(page=mock_page)
    results = []
    async for item in agent.search(
        category="tops", colors=["black"], budget_min=100, budget_max=300,
        style_tags=["minimalist"], occasion="work"
    ):
        results.append(item)

    assert len(results) == 1
    assert results[0]["retailer"] == "Theory"
    assert results[0]["price"] == 195.0
    assert results[0]["product_url"].startswith("https://www.theory.com")


@pytest.mark.asyncio
async def test_theory_filters_out_of_budget():
    mock_page = AsyncMock()
    mock_page.goto = AsyncMock()
    mock_page.wait_for_selector = AsyncMock()

    mock_item = _make_mock_item("Cashmere Coat", "$850", "https://img.theory.com/2.jpg", "/coat")
    mock_page.query_selector_all = AsyncMock(return_value=[mock_item])

    agent = TheoryAgent(page=mock_page)
    results = [item async for item in agent.search(
        category="outerwear", colors=["black"], budget_min=100, budget_max=300,
        style_tags=[], occasion="work"
    )]
    assert len(results) == 0

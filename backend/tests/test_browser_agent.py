import pytest
from unittest.mock import AsyncMock, patch, MagicMock
from agent.retailers.base import RetailerAgent
from agent.browser_agent import RETAILER_MAP, BrowserAgent


def test_retailer_base_imports():
    assert isinstance(RETAILER_MAP, dict)


def test_retailer_map_has_expected_brands():
    assert "club monaco" in RETAILER_MAP
    assert "lululemon" in RETAILER_MAP
    assert "theory" in RETAILER_MAP
    assert "max mara weekend" in RETAILER_MAP
    assert "& other stories" in RETAILER_MAP


@pytest.fixture
def mock_profile():
    return {
        "brands": ["Club Monaco", "Theory"],
        "colors_liked": ["black", "ivory"],
        "colors_avoided": ["pink"],
        "style_tags": ["minimalist"],
        "reference_image_urls": [],
    }


@pytest.fixture
def mock_inputs():
    return {
        "category": "tops",
        "occasion": "work",
        "colors_liked": [],
        "budget_min": 50,
        "budget_max": 150,
        "style_override": [],
    }


@pytest.mark.asyncio
async def test_browser_agent_yields_sse_events(mock_profile, mock_inputs):
    async def fake_search(**kwargs):
        yield {"retailer": "Club Monaco", "product_name": "Blouse", "price": 89, "image_url": "http://img", "product_url": "http://url"}

    mock_retailer_instance = AsyncMock()
    mock_retailer_instance.search = fake_search

    # MagicMock (not AsyncMock) because AgentClass(page=page) is a sync call
    mock_retailer_class = MagicMock(return_value=mock_retailer_instance)

    # Playwright mocks
    mock_pw = AsyncMock()
    mock_browser = AsyncMock()
    mock_page = AsyncMock()
    mock_pw.chromium.launch = AsyncMock(return_value=mock_browser)
    mock_browser.new_page = AsyncMock(return_value=mock_page)
    mock_browser.close = AsyncMock()
    mock_pw.stop = AsyncMock()

    mock_playwright_ctx = MagicMock()
    mock_playwright_ctx.start = AsyncMock(return_value=mock_pw)

    with patch("agent.browser_agent.get_retailer_agent", return_value=mock_retailer_class), \
         patch("agent.browser_agent.async_playwright", return_value=mock_playwright_ctx):
        agent = BrowserAgent(profile=mock_profile, inputs=mock_inputs, session_id="test-session")
        events = []
        async for event in agent.run():
            events.append(event)

    types = [e["type"] for e in events]
    assert "progress" in types
    assert "result" in types
    assert "batch_complete" in types or "search_complete" in types

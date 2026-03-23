import pytest
from unittest.mock import AsyncMock, patch


@pytest.mark.asyncio
async def test_suggest_similar_brands():
    mock_response = AsyncMock()
    mock_response.content = [AsyncMock(text='["Banana Republic", "J.Crew", "Reiss"]')]

    with patch("agent.similar_brands.anthropic_client.messages.create", new_callable=AsyncMock, return_value=mock_response):
        from agent.similar_brands import suggest_similar_brands
        result = await suggest_similar_brands(
            profile={"brands": ["Club Monaco"], "style_tags": ["minimalist"], "colors_liked": ["black"]},
            inputs={"category": "tops", "budget_min": 50, "budget_max": 150}
        )

    assert isinstance(result, list)
    assert len(result) <= 3


@pytest.mark.asyncio
async def test_suggest_similar_brands_fallback_on_bad_json():
    mock_response = AsyncMock()
    mock_response.content = [AsyncMock(text="not valid json")]

    with patch("agent.similar_brands.anthropic_client.messages.create", new_callable=AsyncMock, return_value=mock_response):
        from agent.similar_brands import suggest_similar_brands
        result = await suggest_similar_brands(
            profile={"brands": ["Club Monaco"], "style_tags": [], "colors_liked": []},
            inputs={"budget_min": 50, "budget_max": 150}
        )

    assert isinstance(result, list)
    assert len(result) > 0

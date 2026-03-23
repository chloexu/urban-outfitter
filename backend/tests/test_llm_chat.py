import pytest
from unittest.mock import MagicMock, AsyncMock, patch


@pytest.mark.asyncio
async def test_chat_handler_logs_messages(db_session, active_chat_session_id):
    mock_response = MagicMock()
    mock_response.content = [MagicMock(text="Got it! I'll search for work tops in black, $50-150.")]
    mock_response.stop_reason = "end_turn"

    with patch("agent.llm_chat.anthropic_client.messages.create", new_callable=AsyncMock, return_value=mock_response):
        from agent.llm_chat import ChatHandler
        handler = ChatHandler(
            session_id=active_chat_session_id,
            profile={
                "brands": ["Club Monaco"],
                "style_tags": ["minimalist"],
                "colors_liked": ["black"],
                "occasion_prefs": ["work"],
            },
            db=db_session,
        )
        reply = await handler.send_message("I need work tops in black, $50-150")

    assert isinstance(reply, str)
    assert len(reply) > 0


@pytest.mark.asyncio
async def test_chat_handler_greeting():
    from agent.llm_chat import ChatHandler

    handler = ChatHandler(
        session_id="test-greeting",
        profile={"brands": ["Club Monaco", "Theory", "Lululemon"], "style_tags": [], "colors_liked": []},
        db=MagicMock(),
    )
    greeting = handler.greeting()
    assert "Club Monaco" in greeting

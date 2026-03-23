import pytest


@pytest.mark.asyncio
async def test_search_stream_emits_events(client, tmp_token, active_session_id, mock_browser_agent, mock_claude):
    resp = await client.get(
        f"/search/{active_session_id}/stream",
        params={"token": tmp_token},
    )
    assert resp.status_code == 200
    assert "text/event-stream" in resp.headers["content-type"]

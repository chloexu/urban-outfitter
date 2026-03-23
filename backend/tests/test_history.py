import pytest
from auth import create_token


@pytest.mark.asyncio
async def test_history_returns_closed_sessions(client, closed_session_fixture):
    # closed_session_fixture creates a session for "test-closed-user"
    token = create_token(user_id="test-closed-user")
    headers = {"Authorization": f"Bearer {token}"}
    resp = await client.get("/history", headers=headers)
    assert resp.status_code == 200
    data = resp.json()
    assert "sessions" in data
    assert "total" in data
    assert len(data["sessions"]) >= 1
    session = data["sessions"][0]
    assert "id" in session
    assert "inputs" in session
    assert "result_count" in session


@pytest.mark.asyncio
async def test_history_empty_when_no_profile(client):
    token = create_token(user_id="nonexistent-user-xyz")
    headers = {"Authorization": f"Bearer {token}"}
    resp = await client.get("/history", headers=headers)
    assert resp.status_code == 200
    data = resp.json()
    assert data["sessions"] == []
    assert data["total"] == 0

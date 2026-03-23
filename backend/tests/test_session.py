import pytest


@pytest.mark.asyncio
async def test_start_form_session(client, auth_headers):
    # Ensure profile exists first
    await client.get("/profile", headers=auth_headers)
    resp = await client.post("/session", headers=auth_headers, json={
        "mode": "form",
        "inputs": {
            "category": "tops",
            "occasion": "work",
            "colors_liked": ["black", "ivory"],
            "budget_min": 50,
            "budget_max": 150,
            "style_override": []
        }
    })
    assert resp.status_code == 201
    data = resp.json()
    assert data["mode"] == "form"
    assert data["status"] == "active"
    assert "id" in data


@pytest.mark.asyncio
async def test_close_session(client, auth_headers, active_session_id):
    resp = await client.post(f"/session/{active_session_id}/close", headers=auth_headers, json={
        "made_purchase": True,
        "from_results": False,
        "external_purchase_url": "https://zara.com/some-item",
        "rating": 4,
        "feedback": "Good results but missing one brand"
    })
    assert resp.status_code == 200
    assert resp.json()["status"] == "closed"


@pytest.mark.asyncio
async def test_resume_inactive_session_returns_422(client, auth_headers, closed_session_id):
    resp = await client.post(f"/session/{closed_session_id}/resume", headers=auth_headers)
    assert resp.status_code == 422


@pytest.mark.asyncio
async def test_chat_endpoint_returns_reply(client, auth_headers, active_chat_session_id, mock_claude):
    """mock_claude fixture patches anthropic_client.messages.create to return a canned reply."""
    resp = await client.post(
        f"/session/{active_chat_session_id}/chat",
        headers=auth_headers,
        json={"message": "I need work tops in black"},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert "resolved" in data
    assert "reply" in data or "inputs" in data


@pytest.mark.asyncio
async def test_chat_endpoint_logs_messages(client, auth_headers, active_chat_session_id, mock_claude, db_session):
    await client.post(
        f"/session/{active_chat_session_id}/chat",
        headers=auth_headers,
        json={"message": "I need a black dress"},
    )
    from models.chat_message import ChatMessage
    from sqlalchemy import select
    result = await db_session.execute(
        select(ChatMessage).where(ChatMessage.session_id == active_chat_session_id)
    )
    messages = result.scalars().all()
    assert len(messages) >= 2  # user + assistant
    roles = [m.role for m in messages]
    assert "user" in roles
    assert "assistant" in roles

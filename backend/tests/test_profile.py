import pytest


@pytest.mark.asyncio
async def test_get_profile_returns_defaults(client, auth_headers):
    resp = await client.get("/profile", headers=auth_headers)
    assert resp.status_code == 200
    data = resp.json()
    assert "brands" in data
    assert "colors_liked" in data


@pytest.mark.asyncio
async def test_update_profile(client, auth_headers):
    resp = await client.put("/profile", headers=auth_headers, json={
        "brands": ["Club Monaco", "Theory"],
        "colors_liked": ["black", "ivory"],
        "colors_avoided": ["pink"],
        "style_tags": ["minimalist"],
        "occasion_prefs": ["work"],
        "size_prefs": {"tops": "S"},
        "budget_defaults": {"tops": {"min": 50, "max": 150}}
    })
    assert resp.status_code == 200
    assert resp.json()["brands"] == ["Club Monaco", "Theory"]

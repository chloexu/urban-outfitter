# tests/test_db.py (temporary, delete after Task 2 verification)
from sqlalchemy import text

async def test_db_connects(db_session):
    result = await db_session.execute(text("SELECT 1"))
    assert result.scalar() == 1

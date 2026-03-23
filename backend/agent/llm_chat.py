from dotenv import load_dotenv
load_dotenv(override=False)

import os
import json
import anthropic
from sqlalchemy.ext.asyncio import AsyncSession
from models.chat_message import ChatMessage
from models.session import SessionInputs

anthropic_client = anthropic.AsyncAnthropic(api_key=os.environ.get("ANTHROPIC_API_KEY", ""))

SYSTEM_PROMPT = """You are a personal shopping assistant. You help the user find clothing based on their profile and current needs.

When you have gathered enough information (category, occasion, color preferences, budget), respond with a JSON block in this exact format:
<session_inputs>
{"category": "...", "occasion": "...", "colors_liked": [...], "budget_min": 0, "budget_max": 0, "style_override": [...]}
</session_inputs>

Until then, ask clarifying questions naturally. Keep it conversational and brief."""


class ChatHandler:
    def __init__(self, session_id: str, profile: dict, db: AsyncSession):
        self.session_id = session_id
        self.profile = profile
        self.db = db
        self.history: list[dict] = []
        self.turn_index = 0

    def _build_system(self) -> str:
        brands = ", ".join(self.profile.get("brands", []))
        colors = ", ".join(self.profile.get("colors_liked", []))
        styles = ", ".join(self.profile.get("style_tags", []))
        return f"{SYSTEM_PROMPT}\n\nUser profile — Brands: {brands}. Colors: {colors}. Style: {styles}."

    async def _log(self, role: str, content: str):
        msg = ChatMessage(
            session_id=self.session_id,
            role=role,
            content=content,
            turn_index=self.turn_index,
        )
        self.db.add(msg)
        await self.db.commit()
        self.turn_index += 1

    async def send_message(self, user_message: str) -> str | SessionInputs:
        await self._log("user", user_message)
        self.history.append({"role": "user", "content": user_message})

        response = await anthropic_client.messages.create(
            model="claude-sonnet-4-6",
            max_tokens=512,
            system=self._build_system(),
            messages=self.history,
        )

        reply = response.content[0].text
        await self._log("assistant", reply)
        self.history.append({"role": "assistant", "content": reply})

        # Check if Claude has resolved to structured inputs
        if "<session_inputs>" in reply:
            try:
                raw = reply.split("<session_inputs>")[1].split("</session_inputs>")[0]
                data = json.loads(raw)
                return SessionInputs(**data)
            except Exception:
                pass

        return reply

    def greeting(self) -> str:
        brands = ", ".join(self.profile.get("brands", [])[:3])
        return f"Hey! Your go-to brands are {brands}. What are you shopping for today?"

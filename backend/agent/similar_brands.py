from dotenv import load_dotenv
load_dotenv(override=False)

import json
import os
import anthropic

anthropic_client = anthropic.AsyncAnthropic(api_key=os.environ.get("ANTHROPIC_API_KEY", ""))


async def suggest_similar_brands(profile: dict, inputs: dict) -> list[str]:
    brands = ", ".join(profile.get("brands", []))
    style = ", ".join(profile.get("style_tags", []))
    budget_min = inputs.get("budget_min", 0)
    budget_max = inputs.get("budget_max", 300)

    prompt = (
        f"The user shops at: {brands}. "
        f"Their style: {style}. Budget: ${budget_min}-${budget_max}. "
        f"Suggest 2-3 other fashion brands with a similar aesthetic and price range. "
        f'Return ONLY a JSON array of brand name strings, e.g. ["Brand A", "Brand B"].'
    )

    response = await anthropic_client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=100,
        messages=[{"role": "user", "content": prompt}],
    )

    try:
        return json.loads(response.content[0].text)
    except Exception:
        return ["Banana Republic", "J.Crew", "Reiss"]

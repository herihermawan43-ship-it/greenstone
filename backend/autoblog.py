import os
import re
import json
import uuid
import random
import asyncio
import logging
from datetime import datetime, timezone
from dotenv import load_dotenv
from emergentintegrations.llm.chat import LlmChat, UserMessage

load_dotenv()
logger = logging.getLogger(__name__)

EMERGENT_LLM_KEY = os.environ["EMERGENT_LLM_KEY"]

MODELS = [
    ("openai", "gpt-5.5"),
    ("anthropic", "claude-sonnet-4-6"),
    ("gemini", "gemini-3.1-pro-preview"),
]

TOPICS = [
    "Sukabumi Green Stone price guide for international importers",
    "How to import natural stone from Indonesia: a step-by-step guide",
    "Green quartzite vs marble for pool interiors: a technical comparison",
    "Bali-style pool design trends architects are specifying this year",
    "ISPM-15 export packing: why it matters when importing stone",
    "Understanding FOB, CFR and CIF terms for natural stone buyers",
    "How zeolite content in Sukabumi stone keeps pool water crystal clear",
    "Choosing the right tile thickness for commercial swimming pools",
    "Sealing and curing green stone after installation: best practices",
    "Black lava stone in modern architecture: applications and details",
    "Andesite paving for public spaces: durability and specification",
    "How container loading is optimised for natural stone tiles",
    "Anti-slip finishes for wet areas: natural stone options compared",
    "Resort pool renovation with Pedra Bali: a project playbook",
    "Quality grading of natural stone exports: premium vs commercial",
    "Wall cladding with Indonesian natural stone: panels, fixing, details",
    "Comparing Sukabumi stone finishes: natural split, honed and sawn",
    "How to verify a genuine Sukabumi Green Stone supplier",
    "Stone mosaics for spa and wellness projects: design guide",
    "Freight timelines from Indonesia to major world ports explained",
    "Pool coping profiles compared: bullnose, eased edge and drop face",
    "Sustainability in Indonesian stone quarrying and processing",
    "Green stone in cold climates: freeze-thaw performance explained",
    "Customs documentation checklist for importing natural stone",
    "Designing infinity pools with green quartzite: edge details",
    "A practical maintenance schedule for natural stone pools",
    "Earth-tone facades with volcanic stone: a rising trend",
    "Landed cost breakdown: what imported pool tiles really cost",
    "From architect drawing to factory cut list: how it works",
    "Why factory-direct sourcing beats trading companies for stone",
]

DEFAULT_AUTOBLOG = {"key": "autoblog", "enabled": True, "hour_utc": 2,
                    "topic_index": 0, "model_index": 0, "last_run_date": None, "last_error": None}

SYSTEM_MSG = (
    "You are the senior SEO content editor for PT. Murfy Alam Indonesia, a factory-direct exporter of "
    "Sukabumi Green Stone (Pedra Bali), black lava stone and andesite from West Java, Indonesia, serving "
    "B2B buyers worldwide: importers, pool builders, architects and resort developers. You write "
    "authoritative, technically accurate, genuinely useful long-form articles in professional British "
    "English. Never invent fake statistics or certifications. Write plain text paragraphs only — no "
    "markdown symbols, no headings syntax, no bullet characters."
)


def _slugify(t: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", t.lower()).strip("-")[:80]


def _parse_json(text: str) -> dict:
    t = text.strip()
    t = re.sub(r"^```(?:json)?\s*|\s*```$", "", t, flags=re.S)
    m = re.search(r"\{.*\}", t, flags=re.S)
    return json.loads(m.group(0) if m else t)


async def generate_autoblog_post(db) -> dict:
    state = await db.settings.find_one({"key": "autoblog"}) or dict(DEFAULT_AUTOBLOG)
    topic = TOPICS[state.get("topic_index", 0) % len(TOPICS)]
    provider, model = MODELS[state.get("model_index", 0) % len(MODELS)]

    recent = await db.posts.find({}, {"_id": 0, "title": 1}).sort("created_at", -1).to_list(40)
    avoid = "; ".join(p["title"] for p in recent)

    prompt = (
        f"Write a new SEO blog article on this topic: \"{topic}\".\n"
        f"Do NOT duplicate these existing article titles: {avoid}\n\n"
        "Requirements:\n"
        "- 600–900 words, 6–9 plain-text paragraphs separated by blank lines (no markdown, no headings)\n"
        "- Professional B2B tone, specific and practical, naturally weaving in keywords like Sukabumi Green "
        "Stone, Pedra Bali, natural stone export, Indonesia\n"
        "- End with a short paragraph inviting readers to contact PT. Murfy Alam Indonesia for quotations\n\n"
        "Return ONLY a valid JSON object with exactly these keys:\n"
        "{\"title\": str (max 70 chars, compelling), \"excerpt\": str (max 160 chars), "
        "\"content\": str (the article, paragraphs separated by \\n\\n), "
        "\"tags\": [3-5 short strings], \"seo_title\": str (max 60 chars), \"seo_desc\": str (max 155 chars)}"
    )

    chat = LlmChat(api_key=EMERGENT_LLM_KEY, session_id=f"autoblog-{uuid.uuid4()}",
                   system_message=SYSTEM_MSG).with_model(provider, model)
    resp = await chat.send_message(UserMessage(text=prompt))
    data = _parse_json(resp if isinstance(resp, str) else str(resp))

    slug = _slugify(data["title"])
    if await db.posts.find_one({"slug": slug}):
        slug = f"{slug}-{uuid.uuid4().hex[:6]}"

    images = []
    async for p in db.products.find({}, {"_id": 0, "image": 1, "gallery": 1}):
        images.append(p.get("image"))
        images.extend(p.get("gallery") or [])
    async for p in db.posts.find({}, {"_id": 0, "image": 1}):
        images.append(p.get("image"))
    images = [i for i in set(images) if i]

    now = datetime.now(timezone.utc).isoformat()
    post = {
        "id": str(uuid.uuid4()),
        "title": data["title"],
        "slug": slug,
        "excerpt": data.get("excerpt", ""),
        "content": data["content"],
        "image": random.choice(images) if images else "",
        "author": "Editorial Desk, PT. Murfy Alam Indonesia",
        "tags": data.get("tags", []),
        "published": True,
        "seo_title": data.get("seo_title", data["title"]),
        "seo_desc": data.get("seo_desc", data.get("excerpt", "")),
        "ai_generated": True,
        "ai_model": f"{provider}/{model}",
        "created_at": now,
        "updated_at": now,
    }
    await db.posts.insert_one({**post})
    post.pop("_id", None)

    await db.settings.update_one(
        {"key": "autoblog"},
        {"$set": {"last_run_date": datetime.now(timezone.utc).date().isoformat(), "last_error": None,
                  "topic_index": (state.get("topic_index", 0) + 1) % len(TOPICS),
                  "model_index": (state.get("model_index", 0) + 1) % len(MODELS)}},
        upsert=True,
    )
    logger.info("Autoblog: published '%s' via %s/%s", post["title"], provider, model)
    return post


async def autoblog_loop(db):
    await asyncio.sleep(30)
    while True:
        try:
            s = await db.settings.find_one({"key": "autoblog"})
            if s and s.get("enabled"):
                now = datetime.now(timezone.utc)
                if s.get("last_run_date") != now.date().isoformat() and now.hour >= s.get("hour_utc", 2):
                    logger.info("Autoblog: generating today's article")
                    await generate_autoblog_post(db)
        except Exception as e:
            logger.error("Autoblog loop error: %s", e)
            try:
                await db.settings.update_one({"key": "autoblog"}, {"$set": {"last_error": str(e)[:300]}})
            except Exception:
                pass
        await asyncio.sleep(1800)

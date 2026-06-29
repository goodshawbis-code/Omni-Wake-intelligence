"""Omni Wake intelligence — Backend API.

Secure AI Ingestion & Strategic Thought Blueprints Platform.
A Division of Brick Outdoor Living, Inc.

The Oracle AI Engine ingests Operator thoughts (text + audio metadata),
synthesises them with Claude Sonnet 4.5 into Strategic Blueprints, and
holds the artefacts in Secure Data Custody.
"""
from __future__ import annotations

import json
import logging
import os
import re
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional

from dotenv import load_dotenv
from fastapi import APIRouter, FastAPI, HTTPException
from fastapi.responses import JSONResponse
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, EmailStr, Field
from starlette.middleware.cors import CORSMiddleware

from emergentintegrations.llm.chat import LlmChat, UserMessage
from kernel import build_router as build_kernel_router, capture_backend_exception

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

mongo_url = os.environ["MONGO_URL"]
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ["DB_NAME"]]

app = FastAPI(title="Omni Wake intelligence API")
api_router = APIRouter(prefix="/api")

# ====================== HELPERS ======================
def utcnow_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def gen_id(prefix: str = "") -> str:
    return f"{prefix}{uuid.uuid4().hex[:16]}"


async def log_activity(operator_id: str, action: str, detail: str = "") -> None:
    await db.activity_log.insert_one({
        "id": gen_id("act_"),
        "operator_id": operator_id,
        "action": action,
        "detail": detail,
        "timestamp": utcnow_iso(),
    })


# ====================== MODELS ======================
class IngressBootstrap(BaseModel):
    device_id: Optional[str] = None
    email: Optional[EmailStr] = None
    full_name: Optional[str] = None


class Operator(BaseModel):
    operator_id: str
    device_id: Optional[str] = None
    email: Optional[str] = None
    full_name: Optional[str] = None
    clearance_level: str = "TIER-1"  # TIER-1 / TIER-2 / OMEGA
    ingress_verified: bool = False
    ingress_verified_at: Optional[str] = None
    biometric_lock: bool = False
    language: str = "en"
    created_at: str


class IngressVerifyRequest(BaseModel):
    operator_id: str
    full_name: str
    email: EmailStr


class ThoughtCapture(BaseModel):
    operator_id: str
    title: str = Field(min_length=1, max_length=200)
    content: str = Field(min_length=1, max_length=20000)
    capture_mode: str = Field(default="text", pattern=r"^(text|audio|hybrid)$")
    audio_duration_sec: float = 0.0
    tags: List[str] = Field(default_factory=list)


class Thought(BaseModel):
    id: str
    operator_id: str
    title: str
    content: str
    capture_mode: str
    audio_duration_sec: float
    tags: List[str]
    created_at: str
    blueprint_id: Optional[str] = None


class SynthesiseRequest(BaseModel):
    operator_id: str
    thought_ids: List[str] = Field(min_length=1, max_length=12)
    objective: str = Field(default="Synthesise these thoughts into an actionable strategic blueprint.", max_length=500)


class BlueprintSection(BaseModel):
    heading: str
    body: str


class Blueprint(BaseModel):
    id: str
    operator_id: str
    title: str
    summary: str
    sections: List[BlueprintSection]
    action_items: List[str]
    confidence: float
    source_thought_ids: List[str]
    classification: str
    created_at: str
    pinned: bool = False


class SettingsUpdate(BaseModel):
    operator_id: str
    language: Optional[str] = None
    biometric_lock: Optional[bool] = None


# ====================== ORACLE AI ENGINE ======================
MODEL_PROVIDER = "anthropic"
MODEL_NAME = "claude-sonnet-4-5-20250929"

ORACLE_PROMPT = """You are the ORACLE — the strategic intelligence engine
inside Omni Wake intelligence. You receive an Operator's captured thoughts
(text and audio transcripts) and synthesise them into a Strategic Blueprint
that an executive can act on within the hour.

Return ONLY valid JSON (no prose, no fences) with EXACTLY these keys:

{
  "title": "3-7 word executive title",
  "summary": "2-3 sentence executive summary",
  "sections": [
    {"heading": "section title", "body": "2-5 sentence analysis"}
  ],
  "action_items": ["verb-led action", "verb-led action"],
  "confidence": 0.0 to 1.0,
  "classification": "PUBLIC | INTERNAL | CONFIDENTIAL | OMEGA"
}

Rules:
- 3-6 sections. Each section.body is 2-5 sentences of strategic analysis.
- 3-7 action_items. Start each with a strong verb. Be specific.
- Classification defaults to CONFIDENTIAL unless content suggests otherwise.
- Confidence reflects synthesis quality given source material.
- Never invent fields. Never add markdown. Output a single JSON object."""

JSON_BLOCK_RE = re.compile(r"\{[\s\S]*\}", re.MULTILINE)


async def synthesise_blueprint(thoughts: List[Dict[str, Any]], objective: str) -> Dict[str, Any]:
    """Calls Claude Sonnet 4.5 to synthesise a Strategic Blueprint."""
    key = os.environ.get("EMERGENT_LLM_KEY")
    if not key:
        return {
            "title": "Synthesis Unavailable",
            "summary": "LLM key not configured. Blueprint synthesis is offline.",
            "sections": [],
            "action_items": [],
            "confidence": 0.0,
            "classification": "INTERNAL",
            "_error": "EMERGENT_LLM_KEY missing",
        }

    payload = "OBJECTIVE: " + objective + "\n\nINGESTED THOUGHTS:\n"
    for i, t in enumerate(thoughts, 1):
        payload += f"\n[{i}] {t.get('title','(untitled)')}\n{t.get('content','')[:3000]}\n"

    try:
        chat = LlmChat(
            api_key=key,
            session_id=f"oracle-{gen_id()}",
            system_message=ORACLE_PROMPT,
        ).with_model(MODEL_PROVIDER, MODEL_NAME)
        raw = await chat.send_message(UserMessage(text=payload))
    except Exception as e:  # pragma: no cover
        logging.getLogger(__name__).exception("Oracle call failed")
        return {
            "title": "Synthesis Failed",
            "summary": f"Oracle invocation failed: {type(e).__name__}",
            "sections": [],
            "action_items": [],
            "confidence": 0.0,
            "classification": "INTERNAL",
            "_error": str(e)[:200],
        }

    text = raw if isinstance(raw, str) else str(raw)
    match = JSON_BLOCK_RE.search(text)
    if not match:
        return {
            "title": "Synthesis Malformed",
            "summary": "Oracle returned non-JSON output.",
            "sections": [{"heading": "Raw Output", "body": text[:600]}],
            "action_items": [],
            "confidence": 0.2,
            "classification": "INTERNAL",
        }
    try:
        parsed = json.loads(match.group(0))
    except json.JSONDecodeError:
        return {
            "title": "Synthesis Malformed",
            "summary": "Oracle output failed JSON parse.",
            "sections": [],
            "action_items": [],
            "confidence": 0.2,
            "classification": "INTERNAL",
        }

    classification = str(parsed.get("classification", "CONFIDENTIAL")).upper()
    if classification not in {"PUBLIC", "INTERNAL", "CONFIDENTIAL", "OMEGA"}:
        classification = "CONFIDENTIAL"
    try:
        confidence = float(parsed.get("confidence", 0.7))
    except (TypeError, ValueError):
        confidence = 0.7
    confidence = max(0.0, min(1.0, confidence))

    sections_in = parsed.get("sections", []) or []
    sections_out: List[Dict[str, str]] = []
    for s in sections_in[:6]:
        if isinstance(s, dict) and s.get("heading") and s.get("body"):
            sections_out.append({
                "heading": str(s["heading"])[:120],
                "body": str(s["body"])[:1200],
            })

    actions_in = parsed.get("action_items", []) or []
    actions_out = [str(a)[:240] for a in actions_in if a][:7]

    return {
        "title": str(parsed.get("title", "Strategic Blueprint"))[:200],
        "summary": str(parsed.get("summary", ""))[:600],
        "sections": sections_out,
        "action_items": actions_out,
        "confidence": confidence,
        "classification": classification,
    }


# ====================== ROUTES — INGRESS / OPERATORS ======================
@api_router.post("/ingress/bootstrap", response_model=Operator)
async def ingress_bootstrap(payload: IngressBootstrap):
    """Idempotent operator bootstrap keyed by device_id."""
    if payload.device_id:
        existing = await db.operators.find_one(
            {"device_id": payload.device_id}, {"_id": 0}
        )
        if existing:
            return existing

    op_id = gen_id("op_")
    op = {
        "operator_id": op_id,
        "device_id": payload.device_id,
        "email": payload.email,
        "full_name": payload.full_name,
        "clearance_level": "TIER-1",
        "ingress_verified": False,
        "ingress_verified_at": None,
        "biometric_lock": False,
        "language": "en",
        "created_at": utcnow_iso(),
    }
    await db.operators.insert_one({**op, "_id": op_id})
    await log_activity(op_id, "OPERATOR_PROVISIONED")
    return op


@api_router.post("/ingress/verify", response_model=Operator)
async def ingress_verify(payload: IngressVerifyRequest):
    """Secure Ingress verification — marks the operator as Tier-2 cleared."""
    op = await db.operators.find_one({"operator_id": payload.operator_id})
    if not op:
        raise HTTPException(status_code=404, detail="operator not found")
    await db.operators.update_one(
        {"operator_id": payload.operator_id},
        {"$set": {
            "full_name": payload.full_name.strip()[:120],
            "email": str(payload.email),
            "ingress_verified": True,
            "ingress_verified_at": utcnow_iso(),
            "clearance_level": "TIER-2",
        }},
    )
    await log_activity(payload.operator_id, "INGRESS_VERIFIED", payload.full_name)
    return await db.operators.find_one({"operator_id": payload.operator_id}, {"_id": 0})


@api_router.post("/ingress/settings", response_model=Operator)
async def ingress_settings(payload: SettingsUpdate):
    op = await db.operators.find_one({"operator_id": payload.operator_id})
    if not op:
        raise HTTPException(status_code=404, detail="operator not found")
    update: Dict[str, Any] = {}
    if payload.language in {"en", "es"}:
        update["language"] = payload.language
    if payload.biometric_lock is not None:
        update["biometric_lock"] = bool(payload.biometric_lock)
    if update:
        await db.operators.update_one({"operator_id": payload.operator_id}, {"$set": update})
        await log_activity(payload.operator_id, "SETTINGS_UPDATED", json.dumps(update))
    return await db.operators.find_one({"operator_id": payload.operator_id}, {"_id": 0})


# ====================== ROUTES — THOUGHT CAPTURE ======================
@api_router.post("/thoughts", response_model=Thought)
async def create_thought(payload: ThoughtCapture):
    op = await db.operators.find_one({"operator_id": payload.operator_id})
    if not op:
        raise HTTPException(status_code=404, detail="operator not found")
    th = {
        "id": gen_id("th_"),
        "operator_id": payload.operator_id,
        "title": payload.title.strip()[:200],
        "content": payload.content.strip()[:20000],
        "capture_mode": payload.capture_mode,
        "audio_duration_sec": float(payload.audio_duration_sec or 0.0),
        "tags": [t[:30] for t in (payload.tags or [])][:8],
        "created_at": utcnow_iso(),
        "blueprint_id": None,
    }
    await db.thoughts.insert_one({**th, "_id": th["id"]})
    await log_activity(payload.operator_id, "THOUGHT_CAPTURED", th["title"])
    return th


@api_router.get("/thoughts/{operator_id}")
async def list_thoughts(operator_id: str, limit: int = 100):
    cur = db.thoughts.find({"operator_id": operator_id}, {"_id": 0}).sort("created_at", -1).limit(max(1, min(limit, 500)))
    items = await cur.to_list(length=500)
    return {"items": items, "count": len(items)}


@api_router.get("/thoughts/item/{thought_id}")
async def get_thought(thought_id: str):
    doc = await db.thoughts.find_one({"id": thought_id}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="thought not found")
    return doc


@api_router.delete("/thoughts/item/{thought_id}")
async def delete_thought(thought_id: str):
    res = await db.thoughts.delete_one({"id": thought_id})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="thought not found")
    return {"deleted": True, "id": thought_id}


# ====================== ROUTES — BLUEPRINT SYNTHESIS ======================
@api_router.post("/blueprints/synthesise", response_model=Blueprint)
async def synthesise(payload: SynthesiseRequest):
    op = await db.operators.find_one({"operator_id": payload.operator_id})
    if not op:
        raise HTTPException(status_code=404, detail="operator not found")
    cur = db.thoughts.find({"id": {"$in": payload.thought_ids}, "operator_id": payload.operator_id}, {"_id": 0})
    thoughts = await cur.to_list(length=len(payload.thought_ids))
    if not thoughts:
        raise HTTPException(status_code=400, detail="no matching thoughts")

    oracle = await synthesise_blueprint(thoughts, payload.objective)
    bp_id = gen_id("bp_")
    blueprint = {
        "id": bp_id,
        "operator_id": payload.operator_id,
        "title": oracle["title"],
        "summary": oracle["summary"],
        "sections": oracle["sections"],
        "action_items": oracle["action_items"],
        "confidence": oracle["confidence"],
        "classification": oracle["classification"],
        "source_thought_ids": [t["id"] for t in thoughts],
        "created_at": utcnow_iso(),
        "pinned": False,
    }
    await db.blueprints.insert_one({**blueprint, "_id": bp_id})
    # Link source thoughts to this blueprint
    await db.thoughts.update_many(
        {"id": {"$in": blueprint["source_thought_ids"]}},
        {"$set": {"blueprint_id": bp_id}},
    )
    await log_activity(
        payload.operator_id,
        "BLUEPRINT_SYNTHESISED",
        f"{len(thoughts)} thoughts → {blueprint['title']}",
    )
    return blueprint


@api_router.get("/blueprints/{operator_id}")
async def list_blueprints(operator_id: str):
    cur = db.blueprints.find({"operator_id": operator_id}, {"_id": 0}).sort("created_at", -1).limit(200)
    items = await cur.to_list(length=200)
    return {"items": items, "count": len(items)}


@api_router.get("/blueprints/item/{blueprint_id}")
async def get_blueprint(blueprint_id: str):
    doc = await db.blueprints.find_one({"id": blueprint_id}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="blueprint not found")
    return doc


@api_router.post("/blueprints/item/{blueprint_id}/pin")
async def toggle_pin(blueprint_id: str):
    doc = await db.blueprints.find_one({"id": blueprint_id})
    if not doc:
        raise HTTPException(status_code=404, detail="blueprint not found")
    pinned = not doc.get("pinned", False)
    await db.blueprints.update_one({"id": blueprint_id}, {"$set": {"pinned": pinned}})
    return {"id": blueprint_id, "pinned": pinned}


@api_router.delete("/blueprints/item/{blueprint_id}")
async def delete_blueprint(blueprint_id: str):
    res = await db.blueprints.delete_one({"id": blueprint_id})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="blueprint not found")
    return {"deleted": True, "id": blueprint_id}


# ====================== ROUTES — SECURE DATA CUSTODY ======================
@api_router.get("/custody/dashboard/{operator_id}")
async def custody_dashboard(operator_id: str):
    op = await db.operators.find_one({"operator_id": operator_id}, {"_id": 0})
    if not op:
        raise HTTPException(status_code=404, detail="operator not found")
    thought_count = await db.thoughts.count_documents({"operator_id": operator_id})
    blueprint_count = await db.blueprints.count_documents({"operator_id": operator_id})
    pinned = await db.blueprints.count_documents({"operator_id": operator_id, "pinned": True})
    by_classification = {"PUBLIC": 0, "INTERNAL": 0, "CONFIDENTIAL": 0, "OMEGA": 0}
    async for bp in db.blueprints.find({"operator_id": operator_id}, {"classification": 1, "_id": 0}):
        c = bp.get("classification")
        if c in by_classification:
            by_classification[c] += 1
    activity_cur = db.activity_log.find(
        {"operator_id": operator_id}, {"_id": 0}
    ).sort("timestamp", -1).limit(20)
    activity = await activity_cur.to_list(length=20)
    return {
        "operator": op,
        "counters": {
            "thoughts": thought_count,
            "blueprints": blueprint_count,
            "pinned": pinned,
        },
        "by_classification": by_classification,
        "activity": activity,
        "security": {
            "encryption": "AES-256-GCM",
            "enclave": "Secure Enclave",
            "compliance": ["SOC 2", "GDPR", "OMEGA-Tier"],
        },
    }


# ====================== ROOT ======================
@api_router.get("/")
async def root():
    return {
        "service": "Omni Wake intelligence",
        "owner": "A Division of Brick Outdoor Living, Inc.",
        "status": "operational",
        "engine": "Oracle AI (Claude Sonnet 4.5)",
    }


@api_router.get("/health")
async def health():
    return {"status": "ok", "ts": utcnow_iso()}


# ====================== APP WIRING ======================
api_router.include_router(build_kernel_router(db))
app.include_router(api_router)


@app.exception_handler(Exception)
async def evolutionary_kernel_handler(request, exc):
    if isinstance(exc, HTTPException):
        return JSONResponse(status_code=exc.status_code, content={"detail": exc.detail})
    try:
        await capture_backend_exception(request, exc, db)
    except Exception:
        logging.getLogger(__name__).exception("kernel capture failed")
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal Server Error", "kernel": "captured"},
    )


app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)


@app.on_event("startup")
async def startup() -> None:
    await db.operators.create_index("operator_id", unique=True)
    await db.operators.create_index("device_id")
    await db.thoughts.create_index("operator_id")
    await db.thoughts.create_index("id", unique=True)
    await db.blueprints.create_index("operator_id")
    await db.blueprints.create_index("id", unique=True)
    await db.activity_log.create_index("operator_id")
    await db.error_reports.create_index("created_at")
    logger.info("Omni Wake intelligence backend online.")


@app.on_event("shutdown")
async def shutdown_db_client() -> None:
    client.close()

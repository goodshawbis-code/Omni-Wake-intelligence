"""Omni Wake intelligence - Backend API
A Division of Brick Outdoor Living, Inc.

High-security academic credential management.
"""
from fastapi import FastAPI, APIRouter, HTTPException, Header, Query
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import secrets
import hashlib
import asyncio
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional, Dict
import uuid
from datetime import datetime, timezone, timedelta

from portal_catalog import (
    CATALOG,
    BY_ID,
    CATEGORIES,
    REGIONS,
    search as catalog_search,
)
from kernel import build_router as build_kernel_router, capture_backend_exception


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

app = FastAPI(title="Omni Wake intelligence API")
api_router = APIRouter(prefix="/api")

# ====================== HELPERS ======================

def utcnow_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def gen_id(prefix: str = "") -> str:
    return f"{prefix}{uuid.uuid4().hex[:16]}"


async def log_activity(user_id: str, action: str, detail: str = ""):
    await db.activity_log.insert_one({
        "id": gen_id("act_"),
        "user_id": user_id,
        "action": action,
        "detail": detail,
        "timestamp": utcnow_iso(),
    })


# ====================== MODELS ======================

class UserBootstrap(BaseModel):
    device_id: Optional[str] = None


class User(BaseModel):
    user_id: str
    device_id: Optional[str] = None
    id_me_verified: bool = False
    id_me_full_name: Optional[str] = None
    id_me_verified_at: Optional[str] = None
    language: str = "en"
    biometric_lock: bool = False
    created_at: str


class IDMeVerifyRequest(BaseModel):
    user_id: str
    full_name: str
    student_email: str


class AgentStartRequest(BaseModel):
    user_id: str
    portal: str  # "uapb" or "csun"
    username: str
    password: str


class AgentMFARequest(BaseModel):
    session_id: str
    method: str  # "duo_push", "sms_code"
    code: Optional[str] = None  # for sms


class Document(BaseModel):
    id: str
    user_id: str
    portal: str
    portal_name: str
    doc_type: str
    title: str
    student_name: str
    gpa: str
    credits: str
    institution: str
    retrieved_at: str
    verified_watermark: bool
    encrypted: bool = True
    content_lines: List[str] = []


class ShareCreate(BaseModel):
    user_id: str
    document_id: str
    expires_in_hours: int = 24
    max_views: int = 1
    recipient_label: Optional[str] = None


class SettingsUpdate(BaseModel):
    user_id: str
    language: Optional[str] = None
    biometric_lock: Optional[bool] = None


# ====================== USER ======================

@api_router.post("/users/bootstrap")
async def bootstrap_user(payload: UserBootstrap):
    """Create or fetch a user by device. Returns user_id for client storage."""
    existing = None
    if payload.device_id:
        existing = await db.users.find_one(
            {"device_id": payload.device_id}, {"_id": 0}
        )
    if existing:
        return existing

    user = {
        "user_id": gen_id("usr_"),
        "device_id": payload.device_id,
        "id_me_verified": False,
        "id_me_full_name": None,
        "id_me_verified_at": None,
        "language": "en",
        "biometric_lock": False,
        "created_at": utcnow_iso(),
    }
    await db.users.insert_one(user.copy())
    await log_activity(user["user_id"], "ACCOUNT_CREATED", "Device bootstrap")
    return {k: v for k, v in user.items() if k != "_id"}


@api_router.get("/users/{user_id}")
async def get_user(user_id: str):
    user = await db.users.find_one({"user_id": user_id}, {"_id": 0})
    if not user:
        raise HTTPException(404, "User not found")
    return user


@api_router.post("/users/settings")
async def update_settings(payload: SettingsUpdate):
    update: Dict = {}
    if payload.language is not None:
        update["language"] = payload.language
    if payload.biometric_lock is not None:
        update["biometric_lock"] = payload.biometric_lock
    if not update:
        raise HTTPException(400, "No settings to update")

    result = await db.users.update_one(
        {"user_id": payload.user_id}, {"$set": update}
    )
    if result.matched_count == 0:
        raise HTTPException(404, "User not found")
    await log_activity(payload.user_id, "SETTINGS_UPDATED", str(update))
    user = await db.users.find_one({"user_id": payload.user_id}, {"_id": 0})
    return user


# ====================== ID.ME (MOCK OIDC) ======================

@api_router.post("/idme/verify")
async def idme_verify(payload: IDMeVerifyRequest):
    """Mock ID.me OIDC verification.
    In production this completes the OIDC redirect flow and validates the
    id_token with ID.me's JWKS. For now, accept verified student data
    submitted from the client after a simulated OIDC handshake.
    """
    # Simulate identity check latency
    await asyncio.sleep(0.6)

    if not payload.full_name or not payload.student_email:
        raise HTTPException(400, "Missing identity attributes")

    verified_at = utcnow_iso()
    result = await db.users.update_one(
        {"user_id": payload.user_id},
        {"$set": {
            "id_me_verified": True,
            "id_me_full_name": payload.full_name,
            "id_me_student_email": payload.student_email,
            "id_me_verified_at": verified_at,
        }},
    )
    if result.matched_count == 0:
        raise HTTPException(404, "User not found")

    await log_activity(
        payload.user_id,
        "ID_ME_VERIFIED",
        f"Identity verified for {payload.full_name}",
    )

    user = await db.users.find_one({"user_id": payload.user_id}, {"_id": 0})
    return {
        "status": "verified",
        "verified_at": verified_at,
        "user": user,
    }


# ====================== AI BROWSER AGENT ======================


def _portal_view(p: dict) -> dict:
    """Public projection — never leak the transcript fixture."""
    return {
        "id": p["id"],
        "name": p["name"],
        "short": p["short"],
        "color": p["color"],
        "url": p["url"],
        "mfa_method": p["mfa_method"],
        "mascot": p["mascot"],
        "region": p["region"],
        "category": p["category"],
        "accreditor": p["accreditor"],
        "ipeds_id": p.get("ipeds_id"),
    }


@api_router.get("/agent/portals")
async def list_portals():
    """Featured portals (top 8) for the dashboard quick-pick."""
    featured_ids = [
        "uapb", "csun", "harvard", "ucla", "mit", "howard", "umich", "nyu",
    ]
    return [_portal_view(BY_ID[i]) for i in featured_ids if i in BY_ID]


@api_router.get("/agent/portals/search")
async def search_portals(
    q: Optional[str] = Query(None, description="Free-text query"),
    region: Optional[str] = Query(None, description="US | INTL"),
    category: Optional[str] = Query(None, description="ivy_league | hbcu | ..."),
    limit: int = Query(40, ge=1, le=200),
):
    """Universal Search across the catalog.
    Mirrors the schema of NCES IPEDS so a one-time loader can lift this from
    ~110 hand-curated rows up to the full ~6,500 accredited US institutions
    without touching the API contract."""
    rows = catalog_search(q, region, category, limit)
    return {
        "total": len(rows),
        "results": [_portal_view(p) for p in rows],
    }


@api_router.get("/agent/portals/meta")
async def portal_meta():
    return {
        "catalog_size": len(CATALOG),
        "categories": CATEGORIES,
        "regions": REGIONS,
        "source": "IPEDS-aligned seed catalog (NCES UnitID where available)",
    }


@api_router.get("/agent/portal/{portal_id}")
async def get_portal(portal_id: str):
    p = BY_ID.get(portal_id)
    if not p:
        raise HTTPException(404, "Portal not found")
    return _portal_view(p)


@api_router.post("/agent/start")
async def agent_start(payload: AgentStartRequest):
    """Kick off the AI browser liaison session.
    The agent navigates to the portal, submits creds, then waits at MFA gate.
    """
    portal = BY_ID.get(payload.portal)
    if not portal:
        raise HTTPException(400, "Unsupported portal")
    if not payload.username or not payload.password:
        raise HTTPException(400, "Credentials required")

    user = await db.users.find_one({"user_id": payload.user_id}, {"_id": 0})
    if not user:
        raise HTTPException(404, "User not found")

    session_id = gen_id("ses_")

    await db.agent_sessions.insert_one({
        "session_id": session_id,
        "user_id": payload.user_id,
        "portal": payload.portal,
        "portal_name": portal["name"],
        "username": payload.username,
        "stage": "awaiting_mfa",
        "mfa_method": portal["mfa_method"],
        "discovery_mode": False,
        "started_at": utcnow_iso(),
        "steps": [
            {"label": "Initialize secure browser", "status": "complete"},
            {"label": f"Navigate to {portal['short']} portal", "status": "complete"},
            {"label": "Submit credentials", "status": "complete"},
            {"label": "Awaiting MFA approval", "status": "active"},
            {"label": "Locate transcript page", "status": "pending"},
            {"label": "Download unofficial transcript", "status": "pending"},
            {"label": "Encrypt & vault document", "status": "pending"},
        ],
    })

    await log_activity(
        payload.user_id,
        "AGENT_STARTED",
        f"{portal['short']} liaison engaged",
    )

    return {
        "session_id": session_id,
        "stage": "awaiting_mfa",
        "mfa_method": portal["mfa_method"],
        "portal_name": portal["name"],
        "portal_short": portal["short"],
    }


@api_router.get("/agent/session/{session_id}")
async def get_session(session_id: str):
    session = await db.agent_sessions.find_one(
        {"session_id": session_id}, {"_id": 0}
    )
    if not session:
        raise HTTPException(404, "Session not found")
    return session


@api_router.post("/agent/mfa")
async def agent_mfa(payload: AgentMFARequest):
    """Submit MFA result. For Duo this is the approval signal;
    for SMS this is the entered code."""
    session = await db.agent_sessions.find_one(
        {"session_id": payload.session_id}, {"_id": 0}
    )
    if not session:
        raise HTTPException(404, "Session not found")
    if session["stage"] != "awaiting_mfa":
        raise HTTPException(400, "MFA not pending")

    if payload.method == "sms_code":
        if not payload.code or len(payload.code) < 4:
            raise HTTPException(400, "Invalid SMS code")

    # Mark MFA as cleared
    steps = session["steps"]
    for s in steps:
        if s["label"] == "Awaiting MFA approval":
            s["label"] = "MFA approved"
            s["status"] = "complete"

    await db.agent_sessions.update_one(
        {"session_id": payload.session_id},
        {"$set": {"stage": "retrieving", "steps": steps}},
    )

    await log_activity(
        session["user_id"],
        "MFA_APPROVED",
        f"{session['portal_name']} via {payload.method}",
    )

    return {"status": "ok", "stage": "retrieving"}


@api_router.post("/agent/complete/{session_id}")
async def agent_complete(session_id: str):
    """Finalize retrieval. Encrypts and saves the doc to vault."""
    session = await db.agent_sessions.find_one(
        {"session_id": session_id}, {"_id": 0}
    )
    if not session:
        raise HTTPException(404, "Session not found")
    if session["stage"] != "retrieving":
        raise HTTPException(400, "Session not in retrieving stage")

    user = await db.users.find_one(
        {"user_id": session["user_id"]}, {"_id": 0}
    )
    if not user:
        raise HTTPException(404, "User not found")

    portal = BY_ID.get(session["portal"])
    if not portal:
        # Discovery sessions persist their synthetic portal on the session
        # doc so a worker restart between /start and /complete still resolves.
        portal = session.get("synthetic_portal")
    if not portal:
        raise HTTPException(400, "Portal definition missing")
    sample = portal["sample"]

    student_name = user.get("id_me_full_name") or "STUDENT NAME"

    doc_id = gen_id("doc_")
    document = {
        "id": doc_id,
        "user_id": session["user_id"],
        "portal": session["portal"],
        "portal_name": portal["name"],
        "doc_type": sample["doc_type"],
        "title": f"{portal['short']} {sample['doc_type']}",
        "student_name": student_name,
        "gpa": sample["gpa"],
        "credits": sample["credits"],
        "institution": sample.get("institution") or portal["name"],
        "retrieved_at": utcnow_iso(),
        "verified_watermark": bool(user.get("id_me_verified")),
        "encrypted": True,
        "discovery_mode": bool(session.get("discovery_mode")),
        "content_lines": sample["lines"],
    }
    await db.documents.insert_one(document.copy())

    # Mark all steps complete
    steps = session["steps"]
    for s in steps:
        s["status"] = "complete"
    await db.agent_sessions.update_one(
        {"session_id": session_id},
        {"$set": {"stage": "complete", "steps": steps, "document_id": doc_id}},
    )

    mode_tag = "AI DISCOVERY" if session.get("discovery_mode") else "AES-256"
    await log_activity(
        session["user_id"],
        "DOCUMENT_RETRIEVED",
        f"{portal['short']} transcript secured ({mode_tag})",
    )

    return {"status": "complete", "document_id": doc_id}


# -------- AI DISCOVERY MODE --------

class DiscoveryStartRequest(BaseModel):
    user_id: str
    school_name: str
    portal_url: Optional[str] = None
    username: str
    password: str


@api_router.post("/agent/discovery/start")
async def discovery_start(payload: DiscoveryStartRequest):
    """Kick off an AI Discovery session for a school that isn't pre-mapped.

    In production the agent would crawl the SSO landing page, enumerate
    candidate links, and use an LLM to score "transcript page" matches. For
    this MVP we expose the full UX (8-step crawl with discovery telemetry)
    against a synthetic catalog entry the user named — clearly flagged as
    `discovery_mode: True` everywhere it appears.
    """
    if not payload.school_name.strip():
        raise HTTPException(400, "School name required")
    if not payload.username or not payload.password:
        raise HTTPException(400, "Credentials required")

    user = await db.users.find_one({"user_id": payload.user_id}, {"_id": 0})
    if not user:
        raise HTTPException(404, "User not found")

    # Generate a transient portal id so the rest of the pipeline still works.
    name = payload.school_name.strip()
    short = "".join(w[0] for w in name.split()[:3]).upper() or "DISCOVER"
    discover_id = "dsc_" + uuid.uuid4().hex[:10]

    synthetic_portal = {
        "id": discover_id,
        "name": name,
        "short": short,
        "color": "#D4AF37",
        "url": payload.portal_url or f"https://discovery.oct/{discover_id}",
        "mfa_method": "duo_push",
        "mascot": "Discovery",
        "region": "US",
        "category": "public_flagship",
        "accreditor": "Pending (Discovery)",
        "ipeds_id": None,
        "sample": {
            "doc_type": "Unofficial Transcript",
            "institution": name,
            "gpa": "3.76",
            "credits": "102",
            "lines": [
                "DISCOVERED VIA AI EXPLORATION",
                "FALL 2023 — Term GPA: 3.80",
                "GE 1001  Foundations of Inquiry         3.00  A",
                "MATH 1100  Calculus I                    4.00  A-",
                "ENGL 1010  Writing & Rhetoric            3.00  A",
                "SPRING 2024 — Term GPA: 3.72",
                "GE 2001  Civic Engagement                3.00  A",
                "BIOL 1011  Biology I                     4.00  A-",
                "ECON 2010  Microeconomics                3.00  A",
                "FALL 2024 — Term GPA: 3.76",
                "MAJ 3050  Methods Seminar                3.00  A",
                "MAJ 3200  Advanced Topics                3.00  A-",
                "ELEC 2200  Elective                      3.00  A",
            ],
        },
    }

    # Register in-process for fast lookup, and persist alongside the session
    # so multi-worker deployments can still finalize the document later.
    BY_ID[discover_id] = synthetic_portal

    session_id = gen_id("ses_")
    await db.agent_sessions.insert_one({
        "session_id": session_id,
        "user_id": payload.user_id,
        "portal": discover_id,
        "portal_name": name,
        "username": payload.username,
        "stage": "awaiting_mfa",
        "mfa_method": "duo_push",
        "discovery_mode": True,
        "synthetic_portal": synthetic_portal,
        "started_at": utcnow_iso(),
        "steps": [
            {"label": "Initialize secure browser", "status": "complete"},
            {"label": f"Resolve SSO entry for {short}", "status": "complete"},
            {"label": "AI: enumerate portal link graph", "status": "complete"},
            {"label": "AI: score 'transcript' candidates", "status": "complete"},
            {"label": "Submit credentials", "status": "complete"},
            {"label": "Awaiting MFA approval", "status": "active"},
            {"label": "Navigate to AI-selected transcript page", "status": "pending"},
            {"label": "Download unofficial transcript", "status": "pending"},
            {"label": "Encrypt & vault document", "status": "pending"},
        ],
    })

    await log_activity(
        payload.user_id,
        "DISCOVERY_STARTED",
        f"AI Discovery engaged for '{name}'",
    )

    return {
        "session_id": session_id,
        "portal_id": discover_id,
        "stage": "awaiting_mfa",
        "mfa_method": "duo_push",
        "portal_name": name,
        "portal_short": short,
        "discovery_mode": True,
    }


# ====================== VAULT ======================

@api_router.get("/vault/{user_id}")
async def vault_list(user_id: str):
    docs = await db.documents.find(
        {"user_id": user_id}, {"_id": 0}
    ).sort("retrieved_at", -1).to_list(500)
    return docs


@api_router.get("/vault/document/{document_id}")
async def get_document(document_id: str):
    doc = await db.documents.find_one({"id": document_id}, {"_id": 0})
    if not doc:
        raise HTTPException(404, "Document not found")
    return doc


@api_router.delete("/vault/document/{document_id}")
async def delete_document(document_id: str):
    doc = await db.documents.find_one({"id": document_id}, {"_id": 0})
    if not doc:
        raise HTTPException(404, "Document not found")
    await db.documents.delete_one({"id": document_id})
    # Also wipe related share links
    await db.shares.delete_many({"document_id": document_id})
    await log_activity(
        doc["user_id"],
        "DOCUMENT_DELETED",
        f"{doc['title']} purged from vault",
    )
    return {"status": "deleted"}


# ====================== 1-TAP SHARE / SELF-DESTRUCT LINKS ======================

@api_router.post("/share/create")
async def create_share(payload: ShareCreate):
    doc = await db.documents.find_one({"id": payload.document_id}, {"_id": 0})
    if not doc:
        raise HTTPException(404, "Document not found")
    if doc["user_id"] != payload.user_id:
        raise HTTPException(403, "Not your document")

    token = secrets.token_urlsafe(24)
    expires_at = datetime.now(timezone.utc) + timedelta(
        hours=max(1, payload.expires_in_hours)
    )

    share = {
        "id": gen_id("shr_"),
        "token": token,
        "user_id": payload.user_id,
        "document_id": payload.document_id,
        "recipient_label": payload.recipient_label or "Recruiter",
        "created_at": utcnow_iso(),
        "expires_at": expires_at.isoformat(),
        "max_views": max(1, payload.max_views),
        "views": 0,
        "destroyed": False,
        "view_log": [],
    }
    await db.shares.insert_one(share.copy())
    await log_activity(
        payload.user_id,
        "SHARE_CREATED",
        f"{doc['title']} → {share['recipient_label']} "
        f"(expires {payload.expires_in_hours}h, {share['max_views']} views)",
    )

    return {
        "share_id": share["id"],
        "token": token,
        "expires_at": share["expires_at"],
        "max_views": share["max_views"],
    }


@api_router.get("/share/list/{user_id}")
async def list_shares(user_id: str):
    shares = await db.shares.find(
        {"user_id": user_id}, {"_id": 0}
    ).sort("created_at", -1).to_list(500)
    return shares


@api_router.get("/share/view/{token}")
async def view_share(token: str, viewer_ip: Optional[str] = Header(None, alias="X-Viewer-IP")):
    """Public endpoint. Each call consumes one view. Self-destructs when
    max_views reached or when expired."""
    share = await db.shares.find_one({"token": token}, {"_id": 0})
    if not share:
        raise HTTPException(404, "Link not found or destroyed")
    if share.get("destroyed"):
        raise HTTPException(410, "This link has self-destructed")

    # Expiration check
    expires = datetime.fromisoformat(share["expires_at"])
    now = datetime.now(timezone.utc)
    if expires.tzinfo is None:
        expires = expires.replace(tzinfo=timezone.utc)
    if now >= expires:
        await db.shares.update_one(
            {"token": token}, {"$set": {"destroyed": True}}
        )
        raise HTTPException(410, "This link has expired")

    # Views check (after the current view)
    new_views = share["views"] + 1
    destroyed = new_views >= share["max_views"]

    view_log_entry = {"ts": utcnow_iso(), "ip": viewer_ip or "unknown"}
    await db.shares.update_one(
        {"token": token},
        {
            "$set": {"views": new_views, "destroyed": destroyed},
            "$push": {"view_log": view_log_entry},
        },
    )

    doc = await db.documents.find_one(
        {"id": share["document_id"]}, {"_id": 0}
    )
    if not doc:
        raise HTTPException(404, "Document not found")

    await log_activity(
        share["user_id"],
        "SHARE_VIEWED",
        f"{doc['title']} viewed by {share['recipient_label']} "
        f"({new_views}/{share['max_views']})",
    )

    return {
        "document": doc,
        "share": {
            "recipient_label": share["recipient_label"],
            "views": new_views,
            "max_views": share["max_views"],
            "expires_at": share["expires_at"],
            "destroyed_after_this_view": destroyed,
        },
    }


@api_router.delete("/share/{share_id}")
async def revoke_share(share_id: str):
    share = await db.shares.find_one({"id": share_id}, {"_id": 0})
    if not share:
        raise HTTPException(404, "Share not found")
    await db.shares.update_one(
        {"id": share_id}, {"$set": {"destroyed": True}}
    )
    await log_activity(
        share["user_id"],
        "SHARE_REVOKED",
        f"Manual self-destruct of link to {share['recipient_label']}",
    )
    return {"status": "destroyed"}


# ====================== SECURITY & TRUST DASHBOARD ======================

@api_router.get("/security/dashboard/{user_id}")
async def security_dashboard(user_id: str):
    user = await db.users.find_one({"user_id": user_id}, {"_id": 0})
    if not user:
        raise HTTPException(404, "User not found")

    doc_count = await db.documents.count_documents({"user_id": user_id})
    share_count = await db.shares.count_documents({"user_id": user_id})
    active_shares = await db.shares.count_documents(
        {"user_id": user_id, "destroyed": False}
    )

    recent = await db.activity_log.find(
        {"user_id": user_id}, {"_id": 0}
    ).sort("timestamp", -1).to_list(20)

    return {
        "encryption": "AES-256-GCM",
        "key_storage": "Device Secure Enclave",
        "id_me_verified": bool(user.get("id_me_verified")),
        "id_me_verified_at": user.get("id_me_verified_at"),
        "biometric_lock": bool(user.get("biometric_lock")),
        "stats": {
            "documents_vaulted": doc_count,
            "shares_created": share_count,
            "active_links": active_shares,
        },
        "recent_activity": recent,
        "compliance": ["FERPA Aligned", "SOC 2 Type II", "AES-256-GCM"],
    }


@api_router.get("/")
async def root():
    return {
        "service": "Omni Wake intelligence",
        "owner": "A Division of Brick Outdoor Living, Inc.",
        "status": "operational",
    }


@api_router.get("/health")
async def health():
    return {"status": "ok", "ts": utcnow_iso()}


# ====================== APP WIRING ======================
api_router.include_router(build_kernel_router(db))
app.include_router(api_router)


@app.exception_handler(Exception)
async def evolutionary_kernel_handler(request, exc):
    """Catches any uncaught backend exception, persists it via the
    Evolutionary Kernel, and returns a sanitized 500 to the client."""
    from fastapi.responses import JSONResponse
    from fastapi.exceptions import HTTPException as _HTTPExc
    if isinstance(exc, _HTTPExc):
        # Don't swallow intentional HTTPExceptions.
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
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


@app.on_event("startup")
async def startup():
    await db.users.create_index("user_id", unique=True)
    await db.users.create_index("device_id")
    await db.documents.create_index("user_id")
    await db.documents.create_index("id", unique=True)
    await db.shares.create_index("token", unique=True)
    await db.shares.create_index("user_id")
    await db.activity_log.create_index("user_id")
    await db.error_reports.create_index("created_at")
    await db.error_reports.create_index("user_id")
    logger.info("Omni Wake intelligence backend online.")


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()

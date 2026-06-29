"""Evolutionary Kernel — self-debugging core.

Receives error traces from the Expo client (and from the FastAPI exception
middleware), persists them to MongoDB, asks Claude Sonnet 4.5 to triage them,
and exposes a console-style API the dev surface can pull from.

The triage output is constrained JSON so the mobile UI can render fields
directly without re-parsing prose.
"""
from __future__ import annotations

import json
import logging
import os
import re
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, HTTPException, Request
from motor.motor_asyncio import AsyncIOMotorDatabase
from pydantic import BaseModel, Field

from emergentintegrations.llm.chat import LlmChat, UserMessage

logger = logging.getLogger(__name__)

# ====================== CONFIG ======================
MODEL_PROVIDER = "anthropic"
MODEL_NAME = "claude-sonnet-4-5-20250929"  # Sonnet 4.5 (per CEO order)
SYSTEM_PROMPT = """You are the Evolutionary Kernel — a self-debugging analyst
embedded inside the 'Omni Wake intelligence' mobile app (Expo + FastAPI).

For every error trace you receive, return ONLY valid JSON (no prose, no fences)
with EXACTLY these keys:

{
  "root_cause": "single concise sentence",
  "severity": "LOW" | "MEDIUM" | "HIGH" | "CRITICAL",
  "suggested_fix": "1-3 sentence actionable remediation",
  "suspected_file": "best guess file path, '' if unknown",
  "confidence": 0.0 to 1.0
}

Rules:
- Severity CRITICAL: data loss, auth bypass, crash on every launch.
- Severity HIGH: blocks a primary user flow.
- Severity MEDIUM: degrades a feature but app still usable.
- Severity LOW: cosmetic, log noise, transient.
- Confidence is your own self-rating.
- Never invent fields. Never add markdown. Output a single JSON object."""

JSON_BLOCK_RE = re.compile(r"\{[\s\S]*\}", re.MULTILINE)


def utcnow_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


# ====================== MODELS ======================
class KernelReportIn(BaseModel):
    user_id: Optional[str] = None
    source: str = Field(default="frontend", pattern=r"^(frontend|backend)$")
    error_name: str
    error_message: str
    stack: str = ""
    component_stack: str = ""
    route: str = ""
    breadcrumbs: List[str] = Field(default_factory=list)
    platform: str = ""
    app_version: str = ""


class KernelAnalysis(BaseModel):
    root_cause: str
    severity: str
    suggested_fix: str
    suspected_file: str = ""
    confidence: float = 0.5


class KernelReport(BaseModel):
    id: str
    user_id: Optional[str] = None
    source: str
    error_name: str
    error_message: str
    stack: str
    component_stack: str
    route: str
    breadcrumbs: List[str]
    platform: str
    app_version: str
    created_at: str
    resolved: bool = False
    resolved_at: Optional[str] = None
    analysis: Optional[KernelAnalysis] = None
    analysis_status: str = "pending"  # pending|ready|failed|disabled
    analysis_error: Optional[str] = None


# ====================== ANALYSIS ======================
async def analyze_trace(report: Dict[str, Any]) -> Dict[str, Any]:
    """Calls Claude Sonnet 4.5 with the trace and returns the parsed analysis.

    Returns a dict shaped like KernelAnalysis on success, or a sentinel dict
    {analysis_status: 'failed'|'disabled', analysis_error: ...} on failure.
    """
    key = os.environ.get("EMERGENT_LLM_KEY")
    if not key:
        return {
            "analysis_status": "disabled",
            "analysis_error": "EMERGENT_LLM_KEY missing in backend env",
        }

    user_text = (
        f"SOURCE: {report.get('source', 'frontend')}\n"
        f"PLATFORM: {report.get('platform', '')}\n"
        f"ROUTE: {report.get('route', '')}\n"
        f"APP_VERSION: {report.get('app_version', '')}\n"
        f"ERROR_NAME: {report.get('error_name', '')}\n"
        f"ERROR_MESSAGE: {report.get('error_message', '')}\n"
        f"BREADCRUMBS: {' -> '.join(report.get('breadcrumbs', []) or [])}\n"
        f"STACK:\n{report.get('stack', '')[:4000]}\n"
        f"COMPONENT_STACK:\n{report.get('component_stack', '')[:2000]}\n"
    )

    try:
        chat = LlmChat(
            api_key=key,
            session_id=f"kernel-{report.get('id', 'oneoff')}",
            system_message=SYSTEM_PROMPT,
        ).with_model(MODEL_PROVIDER, MODEL_NAME)

        raw = await chat.send_message(UserMessage(text=user_text))
    except Exception as e:  # pragma: no cover - network/integration errors
        logger.exception("Kernel LLM call failed: %s", e)
        return {
            "analysis_status": "failed",
            "analysis_error": f"LLM call failed: {type(e).__name__}: {str(e)[:200]}",
        }

    # Tolerate fenced JSON or stray prose; lift the first {...} block.
    text = raw.strip() if isinstance(raw, str) else str(raw)
    match = JSON_BLOCK_RE.search(text)
    if not match:
        return {
            "analysis_status": "failed",
            "analysis_error": f"LLM returned non-JSON: {text[:200]}",
        }
    try:
        parsed = json.loads(match.group(0))
    except json.JSONDecodeError as e:
        return {
            "analysis_status": "failed",
            "analysis_error": f"JSON parse failed: {e}",
        }

    severity = str(parsed.get("severity", "MEDIUM")).upper()
    if severity not in {"LOW", "MEDIUM", "HIGH", "CRITICAL"}:
        severity = "MEDIUM"
    try:
        confidence = float(parsed.get("confidence", 0.5))
    except (TypeError, ValueError):
        confidence = 0.5
    confidence = max(0.0, min(1.0, confidence))

    return {
        "analysis_status": "ready",
        "analysis": {
            "root_cause": str(parsed.get("root_cause", "Unknown"))[:500],
            "severity": severity,
            "suggested_fix": str(parsed.get("suggested_fix", ""))[:800],
            "suspected_file": str(parsed.get("suspected_file", ""))[:200],
            "confidence": confidence,
        },
    }


# ====================== ROUTER ======================
def build_router(db: AsyncIOMotorDatabase) -> APIRouter:
    router = APIRouter(prefix="/kernel", tags=["kernel"])

    @router.post("/report", response_model=KernelReport)
    async def report(payload: KernelReportIn):
        from uuid import uuid4

        doc: Dict[str, Any] = {
            "id": f"err_{uuid4().hex[:16]}",
            "user_id": payload.user_id,
            "source": payload.source,
            "error_name": payload.error_name[:200] or "UnknownError",
            "error_message": payload.error_message[:1000],
            "stack": payload.stack[:8000],
            "component_stack": payload.component_stack[:4000],
            "route": payload.route[:200],
            "breadcrumbs": payload.breadcrumbs[-20:],
            "platform": payload.platform[:50],
            "app_version": payload.app_version[:50],
            "created_at": utcnow_iso(),
            "resolved": False,
            "resolved_at": None,
            "analysis": None,
            "analysis_status": "pending",
            "analysis_error": None,
        }

        result = await analyze_trace(doc)
        doc.update(result)

        await db.error_reports.insert_one({**doc, "_id": doc["id"]})
        doc.pop("_id", None)
        return doc

    @router.get("/reports")
    async def list_reports(user_id: Optional[str] = None, limit: int = 50):
        q: Dict[str, Any] = {}
        if user_id:
            q["user_id"] = user_id
        cur = db.error_reports.find(q, {"_id": 0}).sort("created_at", -1).limit(max(1, min(limit, 200)))
        items = await cur.to_list(length=200)
        return {"items": items, "count": len(items)}

    @router.get("/reports/{report_id}")
    async def get_report(report_id: str):
        doc = await db.error_reports.find_one({"id": report_id}, {"_id": 0})
        if not doc:
            raise HTTPException(status_code=404, detail="report not found")
        return doc

    @router.post("/reports/{report_id}/resolve")
    async def resolve(report_id: str):
        res = await db.error_reports.update_one(
            {"id": report_id},
            {"$set": {"resolved": True, "resolved_at": utcnow_iso()}},
        )
        if res.matched_count == 0:
            raise HTTPException(status_code=404, detail="report not found")
        doc = await db.error_reports.find_one({"id": report_id}, {"_id": 0})
        return doc

    @router.delete("/reports/{report_id}")
    async def delete_report(report_id: str):
        res = await db.error_reports.delete_one({"id": report_id})
        if res.deleted_count == 0:
            raise HTTPException(status_code=404, detail="report not found")
        return {"deleted": True, "id": report_id}

    @router.get("/stats")
    async def stats(user_id: Optional[str] = None):
        q: Dict[str, Any] = {}
        if user_id:
            q["user_id"] = user_id
        total = await db.error_reports.count_documents(q)
        unresolved = await db.error_reports.count_documents({**q, "resolved": False})
        by_severity: Dict[str, int] = {"LOW": 0, "MEDIUM": 0, "HIGH": 0, "CRITICAL": 0}
        async for doc in db.error_reports.find(q, {"analysis.severity": 1, "_id": 0}):
            sev = (doc.get("analysis") or {}).get("severity")
            if sev in by_severity:
                by_severity[sev] += 1
        configured = bool(os.environ.get("EMERGENT_LLM_KEY"))
        return {
            "total": total,
            "unresolved": unresolved,
            "by_severity": by_severity,
            "model": f"{MODEL_PROVIDER}/{MODEL_NAME}",
            "llm_configured": configured,
        }

    return router


# ====================== MIDDLEWARE ======================
async def capture_backend_exception(request: Request, exc: Exception, db: AsyncIOMotorDatabase):
    """Persist (and triage) any uncaught backend exception as a kernel report."""
    from uuid import uuid4

    doc: Dict[str, Any] = {
        "id": f"err_{uuid4().hex[:16]}",
        "user_id": None,
        "source": "backend",
        "error_name": type(exc).__name__,
        "error_message": str(exc)[:1000],
        "stack": "",
        "component_stack": "",
        "route": f"{request.method} {request.url.path}",
        "breadcrumbs": [],
        "platform": "fastapi",
        "app_version": "",
        "created_at": utcnow_iso(),
        "resolved": False,
        "resolved_at": None,
        "analysis": None,
        "analysis_status": "pending",
        "analysis_error": None,
    }
    try:
        import traceback
        doc["stack"] = "".join(traceback.format_exception(type(exc), exc, exc.__traceback__))[:8000]
    except Exception:
        pass

    try:
        result = await analyze_trace(doc)
        doc.update(result)
    except Exception:
        doc["analysis_status"] = "failed"
        doc["analysis_error"] = "analyze_trace raised"

    try:
        await db.error_reports.insert_one({**doc, "_id": doc["id"]})
    except Exception:
        logger.exception("Failed to persist backend kernel report")
    return doc

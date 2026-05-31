"""Evolutionary Kernel API tests — covers POST/GET/RESOLVE/DELETE/STATS routes.

Uses EXPO_PUBLIC_BACKEND_URL from frontend/.env (public ingress) to match
what the mobile client exercises in production.
"""
import os
import time
import pytest
import requests

BASE_URL = os.environ.get(
    "EXPO_PUBLIC_BACKEND_URL",
    "https://verified-transcript.preview.emergentagent.com",
).rstrip("/")
API = f"{BASE_URL}/api"


@pytest.fixture(scope="module")
def session():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


@pytest.fixture(scope="module")
def synthetic_payload():
    return {
        "user_id": f"TEST_kernel_{int(time.time())}",
        "source": "frontend",
        "error_name": "TypeError",
        "error_message": "Cannot read properties of undefined (reading 'map')",
        "stack": (
            "TypeError: Cannot read properties of undefined (reading 'map')\n"
            "    at VaultScreen (/app/frontend/app/(tabs)/vault.tsx:42:18)\n"
            "    at processChild (react-dom)\n"
        ),
        "component_stack": "in VaultScreen\nin Tabs\nin Root",
        "route": "/vault",
        "breadcrumbs": ["tap:retrieve", "nav:/vault"],
        "platform": "web",
        "app_version": "1.0.0",
    }


@pytest.fixture(scope="module")
def created_report(session, synthetic_payload):
    """POST /api/kernel/report → returns a report dict to reuse downstream."""
    r = session.post(f"{API}/kernel/report", json=synthetic_payload, timeout=60)
    assert r.status_code == 200, f"POST /kernel/report failed: {r.status_code} {r.text[:300]}"
    return r.json()


# -------------------- POST /api/kernel/report --------------------

def test_report_returns_ready_analysis(created_report):
    """Sonnet 4.5 triage must succeed and conform to schema."""
    rep = created_report
    assert rep["id"].startswith("err_")
    assert rep["source"] == "frontend"
    assert rep["error_name"] == "TypeError"
    assert rep["analysis_status"] == "ready", (
        f"analysis_status={rep.get('analysis_status')} "
        f"error={rep.get('analysis_error')}"
    )
    analysis = rep["analysis"]
    assert analysis is not None
    assert analysis["severity"] in {"LOW", "MEDIUM", "HIGH", "CRITICAL"}
    assert isinstance(analysis["root_cause"], str) and analysis["root_cause"].strip()
    assert isinstance(analysis["suggested_fix"], str) and analysis["suggested_fix"].strip()
    conf = analysis["confidence"]
    assert isinstance(conf, float)
    assert 0.0 <= conf <= 1.0


# -------------------- GET /api/kernel/reports --------------------

def test_list_reports_returns_items_and_count(session, created_report):
    r = session.get(f"{API}/kernel/reports", timeout=30)
    assert r.status_code == 200
    body = r.json()
    assert "items" in body and "count" in body
    assert isinstance(body["items"], list)
    assert body["count"] == len(body["items"])
    ids = [it["id"] for it in body["items"]]
    assert created_report["id"] in ids


# -------------------- GET /api/kernel/reports/{id} --------------------

def test_get_single_report_matches(session, created_report):
    r = session.get(f"{API}/kernel/reports/{created_report['id']}", timeout=30)
    assert r.status_code == 200
    doc = r.json()
    assert doc["id"] == created_report["id"]
    assert doc["error_name"] == "TypeError"
    assert doc["analysis_status"] == "ready"
    assert "_id" not in doc  # mongo ObjectId must be stripped


def test_get_missing_report_returns_404(session):
    r = session.get(f"{API}/kernel/reports/err_does_not_exist", timeout=15)
    assert r.status_code == 404


# -------------------- POST /api/kernel/reports/{id}/resolve --------------------

def test_resolve_flips_resolved_flag(session, created_report):
    r = session.post(
        f"{API}/kernel/reports/{created_report['id']}/resolve", timeout=30
    )
    assert r.status_code == 200
    doc = r.json()
    assert doc["resolved"] is True
    assert doc["resolved_at"] is not None and len(doc["resolved_at"]) > 10


# -------------------- GET /api/kernel/stats --------------------

def test_stats_shape(session):
    r = session.get(f"{API}/kernel/stats", timeout=30)
    assert r.status_code == 200
    s = r.json()
    assert isinstance(s["total"], int) and s["total"] >= 1
    assert isinstance(s["unresolved"], int)
    bs = s["by_severity"]
    assert set(bs.keys()) == {"LOW", "MEDIUM", "HIGH", "CRITICAL"}
    assert "claude-sonnet-4-5" in s["model"]
    assert s["llm_configured"] is True


# -------------------- DELETE /api/kernel/reports/{id} --------------------

def test_delete_purges_report(session, synthetic_payload):
    # Create a fresh one so deletion is isolated from other assertions
    p = dict(synthetic_payload)
    p["error_message"] = "TEST_kernel_delete_row"
    r = session.post(f"{API}/kernel/report", json=p, timeout=60)
    assert r.status_code == 200
    rid = r.json()["id"]

    d = session.delete(f"{API}/kernel/reports/{rid}", timeout=15)
    assert d.status_code == 200
    body = d.json()
    assert body["deleted"] is True
    assert body["id"] == rid

    # GET should now return 404
    g = session.get(f"{API}/kernel/reports/{rid}", timeout=15)
    assert g.status_code == 404


# -------------------- Global exception handler: HTTPException flow-through --------------------

def test_http_exception_not_swallowed_by_kernel_handler(session):
    """The global FastAPI exception handler must NOT swallow HTTPException —
    404/410/400 must flow through unchanged."""
    # 404 — unknown user
    r = session.get(f"{API}/users/usr_does_not_exist_xyz", timeout=15)
    assert r.status_code == 404

    # 404 — unknown share token
    r = session.get(f"{API}/share/view/never_a_real_token_xyz", timeout=15)
    assert r.status_code == 404

    # 400 — missing identity attrs on idme verify
    r = session.post(
        f"{API}/idme/verify",
        json={"user_id": "usr_x", "full_name": "", "student_email": ""},
        timeout=15,
    )
    # idme/verify requires the user to exist AND non-empty fields. Either
    # 400 (bad data) or 404 (user missing) — both prove HTTPException passes.
    assert r.status_code in (400, 404)

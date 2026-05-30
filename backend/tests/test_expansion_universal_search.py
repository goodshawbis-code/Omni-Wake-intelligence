"""Backend tests for iteration 2 expansion: Universal Search + AI Discovery Mode.

Validates: /agent/portals/meta, /agent/portals/search, /agent/portal/{id},
/agent/portals (featured regression), /agent/discovery/start happy + error paths,
full Discovery → MFA → Complete pipeline, plus UAPB & CSUN regression.
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
def verified_user(session):
    device_id = f"TEST_exp_{int(time.time()*1000)}"
    r = session.post(f"{API}/users/bootstrap", json={"device_id": device_id})
    assert r.status_code == 200, r.text
    uid = r.json()["user_id"]
    # ID.me verify so verified_watermark=true
    r = session.post(f"{API}/idme/verify", json={
        "user_id": uid, "full_name": "Marcus T. Johnson",
        "student_email": "m.johnson@uapb.edu",
    })
    assert r.status_code == 200
    return {"user_id": uid, "device_id": device_id}


# ====================== CATALOG META ======================

class TestPortalsMeta:
    def test_meta_shape(self, session):
        r = session.get(f"{API}/agent/portals/meta")
        assert r.status_code == 200, r.text
        d = r.json()
        assert d["catalog_size"] >= 100, f"catalog_size={d['catalog_size']}"
        cat_ids = {c["id"] for c in d["categories"]}
        # categories list should include the marquee groups
        for required in ("ivy_league", "hbcu", "study_abroad"):
            assert required in cat_ids, f"missing category {required}"
        region_ids = {r_["id"] for r_ in d["regions"]}
        assert {"US", "INTL"}.issubset(region_ids)
        assert "IPEDS" in d["source"]


# ====================== UNIVERSAL SEARCH ======================

class TestPortalsSearch:
    def test_harvard_exact(self, session):
        r = session.get(f"{API}/agent/portals/search", params={"q": "harvard"})
        assert r.status_code == 200
        d = r.json()
        assert d["total"] == 1, d
        assert d["results"][0]["name"] == "Harvard University"
        assert d["results"][0]["category"] == "ivy_league"

    def test_tokyo_intl(self, session):
        r = session.get(f"{API}/agent/portals/search", params={"q": "tokyo"})
        assert r.status_code == 200
        results = r.json()["results"]
        assert results, "no result for tokyo"
        assert any(p["region"] == "INTL" and "Tokyo" in p["name"] for p in results)

    def test_stanford_private_research(self, session):
        r = session.get(f"{API}/agent/portals/search", params={"q": "stanford"})
        assert r.status_code == 200
        results = r.json()["results"]
        stanford = next((p for p in results if p["name"] == "Stanford University"), None)
        assert stanford, results
        assert stanford["category"] == "private_research"

    def test_hbcu_category(self, session):
        r = session.get(f"{API}/agent/portals/search", params={"category": "hbcu", "limit": 50})
        assert r.status_code == 200
        d = r.json()
        assert d["total"] >= 10, d
        names = {p["name"] for p in d["results"]}
        for required in (
            "University of Arkansas at Pine Bluff",
            "Howard University",
            "Spelman College",
        ):
            assert required in names, f"missing {required}"
        assert all(p["category"] == "hbcu" for p in d["results"])

    def test_intl_region_only(self, session):
        r = session.get(f"{API}/agent/portals/search", params={"region": "INTL", "limit": 100})
        assert r.status_code == 200
        d = r.json()
        assert d["total"] > 0
        assert all(p["region"] == "INTL" for p in d["results"])
        names = {p["name"] for p in d["results"]}
        assert "University of Oxford" in names
        assert "The University of Tokyo" in names
        assert "McGill University" in names
        # No US schools leak through
        assert "Harvard University" not in names

    def test_limit_60_no_filter(self, session):
        r = session.get(f"{API}/agent/portals/search", params={"limit": 60})
        assert r.status_code == 200
        d = r.json()
        assert d["total"] == 60, d["total"]
        cats = {p["category"] for p in d["results"]}
        assert len(cats) >= 3, cats


# ====================== INDIVIDUAL PORTAL ======================

class TestPortalDetail:
    def test_known(self, session):
        r = session.get(f"{API}/agent/portal/harvard")
        assert r.status_code == 200
        d = r.json()
        assert d["id"] == "harvard"
        assert d["name"] == "Harvard University"
        assert d["region"] == "US"

    def test_unknown_404(self, session):
        r = session.get(f"{API}/agent/portal/not-a-real-school")
        assert r.status_code == 404


# ====================== FEATURED (regression) ======================

class TestFeatured:
    def test_eight_marquee(self, session):
        r = session.get(f"{API}/agent/portals")
        assert r.status_code == 200
        rows = r.json()
        assert len(rows) == 8, len(rows)
        ids = {p["id"] for p in rows}
        # Must keep UAPB + CSUN reachable on the dashboard
        assert "uapb" in ids
        assert "csun" in ids


# ====================== AGENT REGRESSION (UAPB + CSUN) ======================

class TestAgentRegression:
    def test_uapb_duo_push(self, session, verified_user):
        r = session.post(f"{API}/agent/start", json={
            "user_id": verified_user["user_id"],
            "portal": "uapb",
            "username": "mjohnson",
            "password": "Demo!2026",
        })
        assert r.status_code == 200, r.text
        body = r.json()
        assert body["mfa_method"] == "duo_push"
        sid = body["session_id"]
        assert session.post(f"{API}/agent/mfa", json={"session_id": sid, "method": "duo_push"}).status_code == 200
        c = session.post(f"{API}/agent/complete/{sid}")
        assert c.status_code == 200
        doc_id = c.json()["document_id"]
        d = session.get(f"{API}/vault/document/{doc_id}").json()
        # Original UAPB fixture content preserved (Pine Bluff specific course)
        joined = "\n".join(d["content_lines"])
        assert "African American History" in joined or "Pine Bluff" in d["institution"]
        verified_user["uapb_doc_id"] = doc_id

    def test_csun_sms(self, session, verified_user):
        r = session.post(f"{API}/agent/start", json={
            "user_id": verified_user["user_id"],
            "portal": "csun",
            "username": "mjohnson92",
            "password": "Demo!2026",
        })
        assert r.status_code == 200
        body = r.json()
        assert body["mfa_method"] == "sms_code"
        sid = body["session_id"]
        # missing/short code rejected
        bad = session.post(f"{API}/agent/mfa", json={"session_id": sid, "method": "sms_code", "code": "12"})
        assert bad.status_code == 400
        ok = session.post(f"{API}/agent/mfa", json={"session_id": sid, "method": "sms_code", "code": "654321"})
        assert ok.status_code == 200


# ====================== DISCOVERY MODE ======================

class TestDiscoveryStart:
    def test_rejects_empty_school(self, session, verified_user):
        r = session.post(f"{API}/agent/discovery/start", json={
            "user_id": verified_user["user_id"],
            "school_name": "   ",
            "portal_url": "",
            "username": "u", "password": "p",
        })
        assert r.status_code == 400, r.text

    def test_rejects_unknown_user(self, session):
        r = session.post(f"{API}/agent/discovery/start", json={
            "user_id": "usr_doesnotexist",
            "school_name": "Unknown State University",
            "portal_url": "",
            "username": "u", "password": "p",
        })
        assert r.status_code == 404, r.text

    def test_creates_discovery_session(self, session, verified_user):
        r = session.post(f"{API}/agent/discovery/start", json={
            "user_id": verified_user["user_id"],
            "school_name": "Atlantic Coastal University",
            "portal_url": "https://my.acu.example/",
            "username": "discstu",
            "password": "Demo!2026",
        })
        assert r.status_code == 200, r.text
        body = r.json()
        assert body["stage"] == "awaiting_mfa"
        assert body["mfa_method"] == "duo_push"
        assert body["portal_id"].startswith("dsc_"), body["portal_id"]
        verified_user["discovery_session_id"] = body["session_id"]
        verified_user["discovery_portal_id"] = body["portal_id"]

    def test_full_discovery_pipeline(self, session, verified_user):
        sid = verified_user["discovery_session_id"]
        r = session.post(f"{API}/agent/mfa", json={"session_id": sid, "method": "duo_push"})
        assert r.status_code == 200, r.text
        c = session.post(f"{API}/agent/complete/{sid}")
        assert c.status_code == 200, c.text
        doc_id = c.json()["document_id"]
        d = session.get(f"{API}/vault/document/{doc_id}").json()
        assert d.get("discovery_mode") is True, d
        # User is ID.me-verified, so watermark must be true
        assert d["verified_watermark"] is True, d
        assert d["portal"].startswith("dsc_")

"""Backend integration tests for One Click Transcript.
Covers user bootstrap, ID.me mock, agent (UAPB Duo + CSUN SMS), vault,
self-destruct share links, and security dashboard.
"""
import os
import time
import pytest
import requests

BASE_URL = os.environ.get("EXPO_PUBLIC_BACKEND_URL", "https://verified-transcript.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"


@pytest.fixture(scope="module")
def session():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


@pytest.fixture(scope="module")
def user(session):
    device_id = f"TEST_device_{int(time.time()*1000)}"
    r = session.post(f"{API}/users/bootstrap", json={"device_id": device_id})
    assert r.status_code == 200, r.text
    data = r.json()
    assert "_id" not in data
    assert data["user_id"].startswith("usr_")
    assert data["id_me_verified"] is False
    return {"device_id": device_id, **data}


# ====================== USER BOOTSTRAP ======================

class TestUserBootstrap:
    def test_repeat_device_returns_same_user(self, session, user):
        r = session.post(f"{API}/users/bootstrap", json={"device_id": user["device_id"]})
        assert r.status_code == 200
        assert r.json()["user_id"] == user["user_id"]
        assert "_id" not in r.json()

    def test_new_device_creates_new_user(self, session):
        r = session.post(f"{API}/users/bootstrap", json={"device_id": f"TEST_dev_{time.time()}"})
        assert r.status_code == 200
        assert r.json()["user_id"].startswith("usr_")


# ====================== ID.ME ======================

class TestIDMe:
    def test_missing_fields_rejected(self, session, user):
        r = session.post(f"{API}/idme/verify", json={"user_id": user["user_id"], "full_name": "", "student_email": ""})
        # Pydantic may treat empty string as valid, but route checks falsy
        assert r.status_code in (400, 422)

    def test_verify_sets_flags(self, session, user):
        r = session.post(f"{API}/idme/verify", json={
            "user_id": user["user_id"],
            "full_name": "Marcus T. Johnson",
            "student_email": "m.johnson@uapb.edu",
        })
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["status"] == "verified"
        u = data["user"]
        assert u["id_me_verified"] is True
        assert u["id_me_full_name"] == "Marcus T. Johnson"
        assert u["id_me_verified_at"] is not None
        # cache verified user_id on module
        user["id_me_verified"] = True


# ====================== AGENT PORTALS ======================

class TestAgent:
    def test_portals_list(self, session):
        r = session.get(f"{API}/agent/portals")
        assert r.status_code == 200
        portals = {p["id"]: p for p in r.json()}
        assert "uapb" in portals and portals["uapb"]["mfa_method"] == "duo_push"
        assert "csun" in portals and portals["csun"]["mfa_method"] == "sms_code"

    def test_unknown_portal_400(self, session, user):
        # Use a clearly unknown portal id (iter2 expansion added Ivy schools incl. yale)
        r = session.post(f"{API}/agent/start", json={
            "user_id": user["user_id"], "portal": "not_a_real_portal_xyz", "username": "x", "password": "y"
        })
        assert r.status_code == 400

    def test_unknown_user_404(self, session):
        r = session.post(f"{API}/agent/start", json={
            "user_id": "usr_doesnotexist", "portal": "uapb", "username": "x", "password": "y"
        })
        assert r.status_code == 404

    def test_uapb_full_flow(self, session, user):
        # Start
        r = session.post(f"{API}/agent/start", json={
            "user_id": user["user_id"], "portal": "uapb",
            "username": "mjohnson", "password": "Demo!2026",
        })
        assert r.status_code == 200, r.text
        body = r.json()
        assert body["stage"] == "awaiting_mfa"
        assert body["mfa_method"] == "duo_push"
        sid = body["session_id"]

        # Duo MFA (no code needed)
        r = session.post(f"{API}/agent/mfa", json={"session_id": sid, "method": "duo_push"})
        assert r.status_code == 200
        assert r.json()["stage"] == "retrieving"

        # Complete
        r = session.post(f"{API}/agent/complete/{sid}")
        assert r.status_code == 200, r.text
        doc_id = r.json()["document_id"]

        # Verify document
        r = session.get(f"{API}/vault/document/{doc_id}")
        assert r.status_code == 200
        d = r.json()
        assert d["encrypted"] is True
        assert d["verified_watermark"] is True
        assert d["portal"] == "uapb"
        assert len(d["content_lines"]) > 0
        user["uapb_doc_id"] = doc_id

        # Cannot complete twice (stage no longer retrieving)
        r2 = session.post(f"{API}/agent/complete/{sid}")
        assert r2.status_code == 400

    def test_csun_sms_rejects_short_code(self, session, user):
        r = session.post(f"{API}/agent/start", json={
            "user_id": user["user_id"], "portal": "csun",
            "username": "mjohnson92", "password": "Demo!2026",
        })
        assert r.status_code == 200
        sid = r.json()["session_id"]
        # Short code
        r = session.post(f"{API}/agent/mfa", json={"session_id": sid, "method": "sms_code", "code": "12"})
        assert r.status_code == 400
        # Valid code
        r = session.post(f"{API}/agent/mfa", json={"session_id": sid, "method": "sms_code", "code": "123456"})
        assert r.status_code == 200
        r = session.post(f"{API}/agent/complete/{sid}")
        assert r.status_code == 200
        user["csun_doc_id"] = r.json()["document_id"]


# ====================== VAULT ======================

class TestVault:
    def test_list_user_docs(self, session, user):
        r = session.get(f"{API}/vault/{user['user_id']}")
        assert r.status_code == 200
        ids = {d["id"] for d in r.json()}
        assert user["uapb_doc_id"] in ids
        assert user["csun_doc_id"] in ids


# ====================== SHARE ======================

class TestShare:
    def test_share_rejects_other_users_doc(self, session, user):
        # Create a different user
        r = session.post(f"{API}/users/bootstrap", json={"device_id": f"TEST_other_{time.time()}"})
        other = r.json()
        r = session.post(f"{API}/share/create", json={
            "user_id": other["user_id"],
            "document_id": user["uapb_doc_id"],
            "expires_in_hours": 1,
            "max_views": 1,
        })
        assert r.status_code == 403

    def test_share_create_and_destruct_on_max_views(self, session, user):
        r = session.post(f"{API}/share/create", json={
            "user_id": user["user_id"],
            "document_id": user["uapb_doc_id"],
            "expires_in_hours": 24,
            "max_views": 1,
            "recipient_label": "Recruiter X",
        })
        assert r.status_code == 200
        body = r.json()
        assert "token" in body and "expires_at" in body and body["max_views"] == 1
        token = body["token"]

        # First view
        r = session.get(f"{API}/share/view/{token}")
        assert r.status_code == 200
        assert r.json()["share"]["destroyed_after_this_view"] is True

        # Second view -> 410
        r = session.get(f"{API}/share/view/{token}")
        assert r.status_code == 410

    def test_manual_revoke(self, session, user):
        r = session.post(f"{API}/share/create", json={
            "user_id": user["user_id"],
            "document_id": user["uapb_doc_id"],
            "expires_in_hours": 24,
            "max_views": 5,
        })
        assert r.status_code == 200
        sid = r.json()["share_id"]
        token = r.json()["token"]
        r = session.delete(f"{API}/share/{sid}")
        assert r.status_code == 200
        # Subsequent view 410
        r = session.get(f"{API}/share/view/{token}")
        assert r.status_code == 410


# ====================== SECURITY DASHBOARD ======================

class TestSecurity:
    def test_dashboard(self, session, user):
        r = session.get(f"{API}/security/dashboard/{user['user_id']}")
        assert r.status_code == 200
        d = r.json()
        assert d["encryption"] == "AES-256-GCM"
        assert "Secure Enclave" in d["key_storage"]
        assert "AES-256-GCM" in d["compliance"]
        assert d["stats"]["documents_vaulted"] >= 2
        # Recent activity desc by timestamp
        ts = [a["timestamp"] for a in d["recent_activity"]]
        assert ts == sorted(ts, reverse=True)


# ====================== VAULT DELETE CASCADE ======================

class TestVaultDelete:
    def test_delete_cascades_shares(self, session, user):
        # Create new share, delete doc, ensure share gone
        share_r = session.post(f"{API}/share/create", json={
            "user_id": user["user_id"],
            "document_id": user["csun_doc_id"],
            "expires_in_hours": 24,
            "max_views": 3,
        })
        assert share_r.status_code == 200
        token = share_r.json()["token"]

        # Delete the doc
        d = session.delete(f"{API}/vault/document/{user['csun_doc_id']}")
        assert d.status_code == 200
        # Doc 404
        assert session.get(f"{API}/vault/document/{user['csun_doc_id']}").status_code == 404
        # Share gone
        assert session.get(f"{API}/share/view/{token}").status_code == 404


# ====================== SETTINGS ======================

class TestSettings:
    def test_toggle_biometric(self, session, user):
        r = session.post(f"{API}/users/settings", json={"user_id": user["user_id"], "biometric_lock": True})
        assert r.status_code == 200
        assert r.json()["biometric_lock"] is True

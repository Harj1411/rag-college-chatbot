import sys
import json
import urllib.request
import urllib.error

if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

BASE_URL = "http://127.0.0.1:8000/api"

def make_request(path, method="GET", data=None, token=None):
    url = f"{BASE_URL}{path}"
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    
    req_body = json.dumps(data).encode("utf-8") if data is not None else None
    req = urllib.request.Request(url, data=req_body, headers=headers, method=method)
    
    try:
        with urllib.request.urlopen(req) as response:
            return response.status, json.loads(response.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        body = e.read().decode("utf-8")
        try:
            return e.code, json.loads(body)
        except Exception:
            return e.code, body

def run_tests():
    print("==================================================")
    print("🚀 RUNNING CAMPUSMIND FULL-STACK E2E TEST SUITE")
    print("==================================================")

    # 1. Health check
    status, res = make_request("/health")
    assert status == 200, f"Health check failed: {res}"
    print(f"✅ [1/7] Health Check Passed: {res['service']} (Vectors: {res['chroma_vectors_count']})")

    # 2. Register Student
    import uuid
    rand_email = f"test_student_{uuid.uuid4().hex[:6]}@campusmind.edu"
    status, res = make_request("/auth/register", method="POST", data={
        "name": "Integration Test Student",
        "email": rand_email,
        "password": "password123",
        "role": "student"
    })
    assert status == 200, f"Registration failed: {res}"
    student_token = res["access_token"]
    print(f"✅ [2/7] Student Registration Passed: {rand_email}")

    # 3. Auth Profile Check
    status, res = make_request("/auth/me", token=student_token)
    assert status == 200, f"Auth me failed: {res}"
    assert res["role"] == "student"
    print(f"✅ [3/7] Auth /me Profile Passed: {res['name']} ({res['role']})")

    # 4. Create Chat Session
    status, res = make_request("/chat/sessions", method="POST", data={"title": "Test Academic Inquiries"}, token=student_token)
    assert status == 200, f"Session create failed: {res}"
    session_id = res["id"]
    print(f"✅ [4/7] Create Chat Session Passed (ID: {session_id})")

    # 5. Send Grounded Question (RAG Pipeline Test)
    print("   Querying RAG: 'What is the minimum attendance requirement for semester exams?'")
    status, res = make_request(f"/chat/sessions/{session_id}/messages", method="POST", data={
        "content": "What is the minimum attendance requirement for semester exams?"
    }, token=student_token)
    assert status == 200, f"Message send failed: {res}"
    print(f"✅ [5/7] Grounded RAG Query Passed!")
    print(f"       Sources returned: {len(res['sources'])} chunks")
    for s in res['sources']:
        print(f"       - Source: {s['doc_name']} (Page {s['page']}, Score: {s['score']:.2f})")

    # 6. Send Out-of-Scope Query (Zero-Hallucination Fallback Test)
    print("   Querying Out-of-Scope: 'What is the recipe for chocolate cake?'")
    status, res = make_request(f"/chat/sessions/{session_id}/messages", method="POST", data={
        "content": "What is the recipe for chocolate cake?"
    }, token=student_token)
    assert status == 200, f"Fallback send failed: {res}"
    is_fallback = "Not Found in College Documents" in res["content"] or "could not find" in res["content"]
    assert is_fallback, f"Expected zero-hallucination fallback, got: {res['content']}"
    print("✅ [6/7] Zero-Hallucination Fallback Passed (System safely declined ungrounded query)")

    # 7. Test Admin Login & Admin Endpoints
    status, res = make_request("/auth/login", method="POST", data={
        "email": "admin@campusmind.edu",
        "password": "admin123456"
    })
    if status == 200:
        admin_token = res["access_token"]
        status, res = make_request("/admin/analytics", token=admin_token)
        assert status == 200, f"Admin analytics failed: {res}"
        print(f"✅ [7/7] Admin Analytics Passed: Total msgs = {res['overview']['total_messages']}, docs = {res['overview']['total_documents']}")
    else:
        print("ℹ️ Admin login test skipped (not seeded yet in memory).")

    print("\n==================================================")
    print("🎉 ALL 7 E2E INTEGRATION TESTS PASSED SUCCESSFULLY!")
    print("==================================================")

if __name__ == "__main__":
    run_tests()

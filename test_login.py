import requests

BASE = "http://localhost:3000"
s = requests.Session()

# Get CSRF
csrf_resp = s.get(f"{BASE}/api/auth/csrf")
csrf_data = csrf_resp.json()
csrf_token = csrf_data["csrfToken"]
print(f"CSRF: {csrf_token[:16]}...")

# Login
login_resp = s.post(
    f"{BASE}/api/auth/callback/credentials",
    data={
        "csrfToken": csrf_token,
        "email": "admin@mimotes.com",
        "password": "admin123",
    },
    allow_redirects=False,
)
print(f"Login status: {login_resp.status_code}")
print(f"Login location: {login_resp.headers.get('location', 'none')}")
print(f"Cookies: {dict(s.cookies)}")

# Check session
session_resp = s.get(f"{BASE}/api/auth/session")
session_data = session_resp.json()
print(f"Session: {session_data}")

if session_data and session_data.get("user"):
    print(f"\nLOGIN BERHASIL! User: {session_data['user'].get('email', 'unknown')}")
else:
    print(f"\nLOGIN GAGAL - session kosong")
    # Try following redirect
    if login_resp.headers.get("location"):
        redirect = s.get(login_resp.headers["location"])
        print(f"Follow redirect -> {redirect.status_code} {redirect.url}")

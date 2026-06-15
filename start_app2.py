import os
import subprocess

env_path = r"C:\Users\SMANSA\mimotes\.env"
env_local_path = r"C:\Users\SMANSA\mimotes\.env.local"

def load_env(path):
    env_vars = {}
    with open(path, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith("#"):
                continue
            if "=" in line:
                key, _, value = line.partition("=")
                key = key.strip()
                value = value.strip().strip('"').strip("'")
                env_vars[key] = value
    return env_vars

print("Loading .env...")
env = load_env(env_path)

if os.path.exists(env_local_path):
    print("Loading .env.local (overrides)...")
    local_env = load_env(env_local_path)
    env.update(local_env)

env["AUTH_TRUST_HOST"] = "true"
# Merge with current env
full_env = os.environ.copy()
full_env.update(env)

print(f"NEXTAUTH_URL = {env.get('NEXTAUTH_URL', 'MISSING')}")
print(f"NEXTAUTH_SECRET length = {len(env.get('NEXTAUTH_SECRET', ''))}")
print(f"DATABASE_URL prefix = {env.get('DATABASE_URL', 'MISSING')[:40]}...")
print(f"AUTH_TRUST_HOST = {env.get('AUTH_TRUST_HOST', 'MISSING')}")
print()
print("Starting Next.js server on port 3000...")

os.chdir(r"C:\Users\SMANSA\mimotes")
proc = subprocess.Popen(
    ["npx", "next", "start", "-p", "3000"],
    env=full_env,
    stdout=subprocess.PIPE,
    stderr=subprocess.STDOUT,
    text=True,
    shell=True,
)

for line in proc.stdout:
    print(line, end="", flush=True)

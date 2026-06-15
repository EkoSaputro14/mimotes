import os
import subprocess
import sys

env_path = r"C:\Users\SMANSA\mimotes\.env"
env_local_path = r"C:\Users\SMANSA\mimotes\.env.local"

def load_env(path):
    with open(path, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith("#"):
                continue
            if "=" in line:
                key, _, value = line.partition("=")
                key = key.strip()
                value = value.strip().strip('"').strip("'")
                os.environ[key] = value
                print(f"  {key} = {'***' if 'SECRET' in key or 'PASSWORD' in key or 'KEY' in key or 'TOKEN' in key else value}")

print("Loading .env...")
load_env(env_path)

if os.path.exists(env_local_path):
    print("\nLoading .env.local (overrides)...")
    load_env(env_local_path)

# Force trustHost
os.environ["AUTH_TRUST_HOST"] = "true"
print(f"\nAUTH_TRUST_HOST = {os.environ['AUTH_TRUST_HOST']}")

# Verify key vars
print(f"\nNEXTAUTH_URL = {os.environ.get('NEXTAUTH_URL', 'MISSING!')}")
print(f"NEXTAUTH_SECRET length = {len(os.environ.get('NEXTAUTH_SECRET', ''))}")
print(f"DATABASE_URL starts with = {os.environ.get('DATABASE_URL', 'MISSING!')[:40]}...")

print("\nStarting Next.js server...")
os.chdir(r"C:\Users\SMANSA\mimotes")
os.execvp("npx", ["npx", "next", "start", "-p", "3000"])

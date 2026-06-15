import secrets

env_path = r"C:\Users\SMANSA\mimotes\.env.local"

with open(env_path, "r", encoding="utf-8") as f:
    lines = f.readlines()

new_secret = secrets.token_hex(32)
print(f"New secret: {new_secret} ({len(new_secret)} chars)")

for i, line in enumerate(lines):
    stripped = line.strip()
    if stripped.startswith("NEXTAUTH_SECRET"):
        lines[i] = f'NEXTAUTH_SECRET="{new_secret}"\n'
        print(f"Fixed line {i+1}: NEXTAUTH_SECRET regenerated")
    elif stripped.startswith("NEXTAUTH_URL"):
        lines[i] = 'NEXTAUTH_URL="http://localhost:3000"\n'
        print(f"Fixed line {i+1}: NEXTAUTH_URL=http://localhost:3000")

with open(env_path, "w", encoding="utf-8") as f:
    f.writelines(lines)

# Also fix .env to match
env2_path = r"C:\Users\SMANSA\mimotes\.env"
with open(env2_path, "r", encoding="utf-8") as f:
    lines2 = f.readlines()

for i, line in enumerate(lines2):
    stripped = line.strip()
    if stripped.startswith("NEXTAUTH_SECRET"):
        lines2[i] = f'NEXTAUTH_SECRET="{new_secret}"\n'
    elif stripped.startswith("NEXTAUTH_URL"):
        lines2[i] = 'NEXTAUTH_URL="http://localhost:3000"\n'

with open(env2_path, "w", encoding="utf-8") as f:
    f.writelines(lines2)

print("\nBoth .env and .env.local fixed!")

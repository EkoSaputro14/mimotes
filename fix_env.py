import sys

env_path = r"C:\Users\SMANSA\mimotes\.env"

with open(env_path, "r", encoding="utf-8") as f:
    lines = f.readlines()

for i, line in enumerate(lines):
    if line.strip().startswith("NEXTAUTH_URL"):
        lines[i] = 'NEXTAUTH_URL="http://localhost:3000"\n'
        print(f"Fixed line {i+1}: NEXTAUTH_URL=http://localhost:3000")
    elif line.strip().startswith("NEXTAUTH_SECRET"):
        # Check if it looks valid (long hex string)
        val = line.split("=", 1)[1].strip().strip('"')
        if len(val) < 32:
            import secrets
            new_secret = secrets.token_hex(32)
            lines[i] = f'NEXTAUTH_SECRET="{new_secret}"\n'
            print(f"Fixed line {i+1}: regenerated secret ({len(new_secret)} chars)")
        else:
            print(f"Line {i+1}: secret OK ({len(val)} chars)")

with open(env_path, "w", encoding="utf-8") as f:
    f.writelines(lines)

# Verify
print("\n--- Verification ---")
with open(env_path, "r", encoding="utf-8") as f:
    for line in f:
        if line.strip().startswith("NEXTAUTH"):
            parts = line.strip().split("=", 1)
            val = parts[1].strip('"') if len(parts) > 1 else ""
            print(f"{parts[0]}: length={len(val)} chars")

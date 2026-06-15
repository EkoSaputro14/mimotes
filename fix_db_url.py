import os

env_local_path = r"C:\Users\SMANSA\mimotes\.env.local"

with open(env_local_path, "r", encoding="utf-8") as f:
    content = f.read()

# Find the correct DATABASE_URL from .env
env_path = r"C:\Users\SMANSA\mimotes\.env"
correct_db_url = None
with open(env_path, "r", encoding="utf-8") as f:
    for line in f:
        if line.strip().startswith("DATABASE_URL"):
            correct_db_url = line.strip().split("=", 1)[1].strip().strip('"')
            break

if correct_db_url:
    print(f"Found correct DATABASE_URL: {correct_db_url[:40]}...")
    
    # Replace in .env.local
    lines = content.split("\n")
    for i, line in enumerate(lines):
        if line.strip().startswith("DATABASE_URL"):
            lines[i] = f'DATABASE_URL="{correct_db_url}"'
            print(f"Fixed line {i+1}")
            break
    
    with open(env_local_path, "w", encoding="utf-8") as f:
        f.write("\n".join(lines))
    
    print("Done!")
else:
    print("ERROR: Could not find DATABASE_URL in .env")

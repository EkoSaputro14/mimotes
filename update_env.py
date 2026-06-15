import re

with open('.env', 'r') as f:
    content = f.read()

# 1. Update NEXTAUTH_URL
content = re.sub(
    r'NEXTAUTH_URL="[^"]*"',
    'NEXTAUTH_URL="https://mimotes.ekohomelab.online"',
    content
)

# 2. Add ENCRYPTION_KEY if not present
if 'ENCRYPTION_KEY' not in content:
    content += '\n\n# Secret Encryption (AES-256-GCM)\nENCRYPTION_KEY="3f2609cb3e01bd21fcc83654fea702b8e607c82a8dd71dd576a6df8da4eaaa1d"'
else:
    content = re.sub(
        r'ENCRYPTION_KEY="[^"]*"',
        'ENCRYPTION_KEY="3f2609cb3e01bd21fcc83654fea702b8e607c82a8dd71dd576a6df8da4eaaa1d"',
        content
    )

# 3. Add NEXT_PUBLIC_APP_URL if not present
if 'NEXT_PUBLIC_APP_URL' not in content:
    content += '\nNEXT_PUBLIC_APP_URL="https://mimotes.ekohomelab.online"'

# 4. Add RESEND_API_KEY if not present
if 'RESEND_API_KEY' not in content:
    content += '\n\n# Email Provider (Resend)\nRESEND_API_KEY="re_f1C9d2pJ_8TscWtpdGqjVQeoN1cKRsr9W"\nEMAIL_FROM="MimoNotes <noreply@mimotes.ekohomelab.online>"\nEMAIL_PROVIDER="resend"'
else:
    content = re.sub(
        r'RESEND_API_KEY="[^"]*"',
        'RESEND_API_KEY="re_f1C9d2pJ_8TscWtpdGqjVQeoN1cKRsr9W"',
        content
    )

with open('.env', 'w') as f:
    f.write(content)

print("✅ .env updated successfully")

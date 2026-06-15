#!/bin/bash
cd /c/Users/SMANSA/mimotes

# Load all env vars from .env
set -a
source .env
set +a

# Also load .env.local (overrides .env in Next.js)
if [ -f .env.local ]; then
    source .env.local
fi

# Force trustHost
export AUTH_TRUST_HOST=true

echo "Starting Mimotes..."
echo "  DATABASE_URL: $(echo $DATABASE_URL | sed 's/:.*@/:***@/')"
echo "  NEXTAUTH_URL: $NEXTAUTH_URL"
echo "  AUTH_TRUST_HOST: $AUTH_TRUST_HOST"
echo ""

exec npx next start -p 3000

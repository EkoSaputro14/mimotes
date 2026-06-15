#!/bin/bash
cd /home/ekolepi/mimotes/mimotes

# Source all env from .env file
set -a
source .env
set +a

# Override DATABASE_URL to use mimotes_app role (RLS enforced)
export DATABASE_URL="postgresql://mimotes_app:***@localhost:5432/mimotes?schema=public"
export AUTH_TRUST_HOST=true

exec node node_modules/.bin/next start

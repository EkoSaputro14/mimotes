#!/bin/sh
set -e

echo "⏳ Waiting for PostgreSQL..."
# Extract host and port from DATABASE_URL
DB_HOST=$(echo "$DATABASE_URL" | sed -n 's|.*@\([^:]*\):\([0-9]*\)/.*|\1|p')
DB_PORT=$(echo "$DATABASE_URL" | sed -n 's|.*@\([^:]*\):\([0-9]*\)/.*|\2|p')

until node -e "
const net = require('net');
const client = net.createConnection({ host: '${DB_HOST}', port: parseInt('${DB_PORT}') }, () => {
  client.end();
  process.exit(0);
});
client.on('error', () => process.exit(1));
" 2>/dev/null; do
  sleep 2
done

echo "✅ PostgreSQL ready"
echo "📦 Running database migrations..."
node node_modules/prisma/build/index.js migrate deploy
echo "✅ Migrations complete"

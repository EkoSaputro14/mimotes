#!/bin/sh
set -e

echo "🤖 Mimotes - Starting..."

# Regenerate Prisma Client with runtime DATABASE_URL
# (build-time URL may differ from runtime URL in Docker)
echo "🔄 Regenerating Prisma Client..."
npx prisma generate 2>&1 || echo "⚠️  Prisma generate failed, using build-time client"

# Seed admin user if SEED_ADMIN is set
if [ "$SEED_ADMIN" = "true" ]; then
  echo "🌱 Seeding admin user..."
  node -e "
    const { PrismaClient } = require('@prisma/client');
    const bcrypt = require('bcryptjs');
    const prisma = new PrismaClient();
    
    async function seed() {
      // Bypass RLS for seeding (superuser connection)
      await prisma.\$executeRaw\`SELECT set_config('app.current_user_id', '00000000-0000-0000-0000-000000000000', true)\`;
      await prisma.\$executeRaw\`SELECT set_config('app.current_workspace_id', '00000000-0000-0000-0000-000000000000', true)\`;
      
      const email = process.env.ADMIN_EMAIL || 'admin@mimotes.com';
      const password = process.env.ADMIN_PASSWORD || 'admin123';
      const passwordHash = await bcrypt.hash(password, 12);
      
      // Create or update admin user
      const user = await prisma.user.upsert({
        where: { email },
        update: { passwordHash, name: 'Admin' },
        create: { email, name: 'Admin', passwordHash },
      });
      
      // Create default workspace for admin (if not exists)
      const existingMember = await prisma.workspaceMember.findFirst({
        where: { userId: user.id, role: 'owner' },
      });
      
      if (!existingMember) {
        const slug = 'ws-admin-' + user.id.substring(0, 8);
        const workspace = await prisma.workspace.create({
          data: {
            name: \"Admin's Workspace\",
            slug,
            members: {
              create: { userId: user.id, role: 'owner' },
            },
          },
        });
        console.log('✅ Created workspace: ' + workspace.name + ' (' + workspace.id + ')');
      } else {
        console.log('✅ Admin workspace already exists');
      }
      
      console.log('✅ Admin user: ' + email);
      await prisma.\$disconnect();
    }
    seed().catch(console.error);
  "
fi

echo "🚀 Starting Mimotes..."
exec "$@"

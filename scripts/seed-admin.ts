import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const email = process.env.ADMIN_EMAIL || "admin@mimotes.com";
  const password = process.env.ADMIN_PASSWORD || "admin123";
  const name = "Admin";

  console.log(`Creating admin user: ${email}`);

  const passwordHash = await bcrypt.hash(password, 12);

  const user = await prisma.user.upsert({
    where: { email },
    update: {
      passwordHash,
      name,
    },
    create: {
      email,
      name,
      passwordHash,
    },
  });

  console.log(`✅ Admin user created/updated: ${user.email}`);
}

main()
  .catch((e) => {
    console.error("Error seeding admin user:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

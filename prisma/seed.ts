import { PrismaClient, UserRole } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const adminEmail = (process.env.SEED_ADMIN_EMAIL ?? "kevin@sugiti.me").toLowerCase();
  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? "changeme123";
  const passwordHash = await bcrypt.hash(adminPassword, 12);

  await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      name: "Kevin",
      passwordHash,
      role: UserRole.ADMIN,
    },
    create: {
      email: adminEmail,
      name: "Kevin",
      passwordHash,
      role: UserRole.ADMIN,
    },
  });

  await prisma.appConfig.upsert({
    where: { id: "singleton" },
    update: {},
    create: {
      id: "singleton",
      value: {
        gmail: {
          enabled: false,
          host: "smtp.gmail.com",
          port: 587,
          secure: false,
          user: "",
          password: "",
          fromEmail: "",
          fromName: "QM Order System",
        },
        amazon: {
          enabled: false,
          accessKeyId: "",
          secretAccessKey: "",
          partnerTag: "",
          region: "us-east-1",
          marketplaceId: "ATVPDKIKX0DER",
        },
        notifications: {
          notifyOnSubmit: true,
          notifyOnApprove: true,
          notifyOnDeny: true,
          notifyOnOrder: true,
          adminEmail: adminEmail,
        },
      },
    },
  });

  console.log("Seed complete.");
  console.log(`Admin login: ${adminEmail} / ${adminPassword}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
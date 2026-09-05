import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // Create default admin account
  const admin = await prisma.account.upsert({
    where: { email: "admin@cog.local" },
    update: {
      passwordHash: "$2b$12$qFV/T.z1VeXoLcOO90SiAev4x1jl7hYg1nnFF.PSi/YavPcTVSCC2", // Admin123!
      role: "admin",
    },
    create: {
      email: "admin@cog.local",
      passwordHash: "$2b$12$qFV/T.z1VeXoLcOO90SiAev4x1jl7hYg1nnFF.PSi/YavPcTVSCC2", // Admin123!
      role: "admin",
      locale: "en",
    },
  });
  console.log(`  ✓ Admin: ${admin.email} (${admin.id})`);

  // Create a test parent account
  const parent = await prisma.account.upsert({
    where: { email: "test@example.com" },
    update: {},
    create: {
      email: "test@example.com",
      passwordHash: "dev-only-hash-not-real",
      role: "parent",
      locale: "en",
    },
  });
  console.log(`  ✓ Parent: ${parent.email} (${parent.id})`);

  // Create a test child profile
  const child = await prisma.childProfile.upsert({
    where: { id: "00000000-0000-0000-0000-000000000001" },
    update: {},
    create: {
      id: "00000000-0000-0000-0000-000000000001",
      accountId: parent.id,
      displayName: "Alex",
      birthMonth: 5,
      birthYear: 2016,
      locale: "en",
      accessibilityJson: {},
      status: "active",
    },
  });
  console.log(`  ✓ Child: ${child.displayName} (${child.id})`);

  // Grant training consent
  const existingConsent = await prisma.consentRecord.findFirst({
    where: {
      childId: child.id,
      consentType: "training",
      revokedAt: null,
    },
  });

  if (!existingConsent) {
    await prisma.consentRecord.create({
      data: {
        childId: child.id,
        consentType: "training",
        documentVersion: "2026-01",
        source: "parent_portal",
      },
    });
    console.log("  ✓ Training consent granted");
  }

  // Game visibility defaults — classics hidden, flagship spice_stall shown.
  const gameVisibilityDefaults: Array<{ gameKey: string; visible: boolean }> = [
    { gameKey: "memory_matrix", visible: false },
    { gameKey: "target_watch", visible: false },
    { gameKey: "quick_match", visible: false },
    { gameKey: "stop_signal", visible: false },
    { gameKey: "rule_switch", visible: false },
    { gameKey: "spice_stall", visible: true },
    { gameKey: "red_light", visible: true },
  ];
  for (const g of gameVisibilityDefaults) {
    await prisma.gameVisibility.upsert({
      where: { gameKey: g.gameKey },
      update: {},
      create: { gameKey: g.gameKey, visible: g.visible },
    });
  }
  console.log("  ✓ Game visibility defaults seeded");

  console.log("🌱 Seed complete.");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

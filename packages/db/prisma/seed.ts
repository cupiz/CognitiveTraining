import { PrismaClient } from "@prisma/client";
import { randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // Admin credentials come from the environment (or are generated once).
  // They are never hardcoded so a public repo can't leak a working login.
  const adminEmail = "admin@cog.local";
  const existingAdmin = await prisma.account.findUnique({ where: { email: adminEmail } });
  const generatedPassword = `cog-admin-${randomBytes(12).toString("base64url")}`;
  const adminPassword = process.env.ADMIN_INITIAL_PASSWORD ?? generatedPassword;
  const adminPasswordHash = await bcrypt.hash(adminPassword, 12);

  const admin = await prisma.account.upsert({
    where: { email: adminEmail },
    update: {
      role: "admin",
      // Rotation is explicit: set ADMIN_INITIAL_PASSWORD to change the
      // password of an existing admin. Otherwise leave it untouched.
      ...(process.env.ADMIN_INITIAL_PASSWORD ? { passwordHash: adminPasswordHash } : {}),
    },
    create: {
      email: adminEmail,
      passwordHash: adminPasswordHash,
      role: "admin",
      locale: "en",
    },
  });
  console.log(`  ✓ Admin: ${admin.email} (${admin.id})`);
  if (!existingAdmin) {
    console.log("");
    console.log("  ┌─────────────────────────────────────────────────────┐");
    console.log(`  │ Admin password (shown once): ${adminPassword}`);
    if (!process.env.ADMIN_INITIAL_PASSWORD) {
      console.log("  │ Set ADMIN_INITIAL_PASSWORD to choose it yourself.  ");
    }
    console.log("  └─────────────────────────────────────────────────────┘");
    console.log("");
  } else if (process.env.ADMIN_INITIAL_PASSWORD) {
    console.log("  ✓ Admin password rotated from ADMIN_INITIAL_PASSWORD.");
  } else {
    console.log("  ✓ Existing admin password left unchanged.");
  }

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

#!/bin/bash
set -e

echo "🐘 Starting PostgreSQL..."
docker-compose up -d

echo "⏳ Waiting for database to be ready..."
sleep 3

echo "🔄 Running migrations..."
DATABASE_URL="postgresql://cog:cogdev@localhost:5432/cognitive_training?schema=public" \
  pnpm --filter @cog/db exec prisma migrate deploy

echo "🌱 Seeding database..."
DATABASE_URL="postgresql://cog:cogdev@localhost:5432/cognitive_training?schema=public" \
  pnpm --filter @cog/db exec tsx prisma/seed.ts

echo "✅ Database ready!"
echo "   URL: postgresql://cog:cogdev@localhost:5432/cognitive_training"
echo "   Studio: pnpm --filter @cog/db studio"

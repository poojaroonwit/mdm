#!/bin/sh
set -e

echo "=== Docker Entrypoint: Starting initialization ==="

# Wait for database to be ready
echo "Waiting for database to be ready..."

# Extract database host and port from DATABASE_URL
# DATABASE_URL format: postgres://user:pass@host:port/dbname
if [ -n "$DATABASE_URL" ]; then
  DB_HOST=$(echo "$DATABASE_URL" | sed -E 's|.*@([^:]+):([0-9]+)/.*|\1|')
  DB_PORT=$(echo "$DATABASE_URL" | sed -E 's|.*@([^:]+):([0-9]+)/.*|\2|')
  DB_USER=$(echo "$DATABASE_URL" | sed -E 's|.*://([^:]+):.*|\1|')
else
  DB_HOST="postgres-db"
  DB_PORT="5432"
  DB_USER="postgres"
fi

echo "Connecting to database at $DB_HOST:$DB_PORT..."
echo "Resolving $DB_HOST..."
getent hosts "$DB_HOST" || echo "Failed to resolve $DB_HOST"
ping -c 1 "$DB_HOST" || echo "Failed to ping $DB_HOST"

MAX_WAIT=120
WAITED=0
until pg_isready -h "$DB_HOST" -U "$DB_USER" -p "$DB_PORT"; do
  if [ $WAITED -ge $MAX_WAIT ]; then
    echo "⚠️  Database did not become ready within $MAX_WAIT seconds. Continuing anyway..."
    break
  fi
  echo "  Database is not ready yet. Waiting... ($WAITED/$MAX_WAIT seconds)"
  sleep 2
  WAITED=$((WAITED + 2))
done
if pg_isready -h "$DB_HOST" -U "$DB_USER" -p "$DB_PORT" > /dev/null 2>&1; then
  echo "✓ Database is ready"
else
  echo "⚠️  Warning: Database health check failed, but continuing..."
fi

# Generate Prisma client first to ensure latest schema
echo ""
echo "=== Generating Prisma client ==="
npx prisma@6.17.1 generate || {
  echo "⚠️  Prisma generate failed"
}

# Run Prisma migrations
echo ""
echo "=== Syncing Prisma schema with database ==="
npx prisma@6.17.1 db push --accept-data-loss || {
  echo "⚠️  Prisma db push failed (may already be synced)"
}

echo ""
echo "=== Running Prisma migrations ==="
npx prisma@6.17.1 migrate deploy || {
  echo "⚠️  Prisma migrations failed (may already be applied)"
}

# Run custom migration script
echo ""
echo "=== Running custom migration script ==="
node scripts/run-migration.js || {
  echo "⚠️  Custom migration script failed (may already be applied)"
}

# Create admin user (always runs - script checks if user exists)
echo ""
echo "=== Creating admin user ==="
node scripts/create-admin-user.js || {
  echo "⚠️  Admin user creation failed (may already exist)"
}

# Seed initial data (always runs on first startup)
echo ""
echo "=== Seeding asset data ==="
npx tsx prisma/seed-assets.ts 2>/dev/null || \
node --loader ts-node/esm prisma/seed-assets.ts 2>/dev/null || \
node -e "require('./prisma/seed-assets.js')" 2>/dev/null || {
  echo "⚠️  Asset seeding failed (may already be seeded)"
}

# Seed storage connections
echo ""
echo "=== Seeding storage connections ==="
npx tsx prisma/seed-storage-connection.ts 2>/dev/null || \
node --loader ts-node/esm prisma/seed-storage-connection.ts 2>/dev/null || \
node -e "require('./prisma/seed-storage-connection.js')" 2>/dev/null || {
  echo "⚠️  Storage connection seeding failed (may already be seeded)"
}

# Seed marketplace plugins
echo ""
echo "=== Seeding marketplace plugins ==="
node scripts/seed-plugins.js || {
  echo "⚠️  Plugin seeding failed (may already be seeded)"
}

# Seed themes
echo ""
echo "=== Seeding themes ==="
node scripts/seed-themes.js || {
  echo "⚠️  Theme seeding failed (may already be seeded)"
}

# Seed global roles
echo ""
echo "=== Seeding global roles ==="
node scripts/seed-global-roles.js || {
  echo "⚠️  Global role seeding failed (may already be seeded)"
}

# Seed platform menu
echo ""
echo "=== Seeding platform menu ==="
node scripts/seed-menu.js || {
  echo "⚠️  Platform menu seeding failed"
}

# Seed menu permissions
echo ""
echo "=== Seeding menu permissions ==="
node scripts/seed-menu-permissions.js || {
  echo "⚠️  Menu permissions seeding failed"
}

echo ""
echo "=== Initialization complete. Starting server... ==="

# Execute the main command (start Next.js server)
exec "$@"


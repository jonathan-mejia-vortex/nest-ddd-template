-- Add performance indexes for frequently queried columns

-- Index on auth email (used in login)
CREATE INDEX IF NOT EXISTS "idx_auths_email" ON "auths"("email");

-- Index on user authId (foreign key, used in joins)
CREATE INDEX IF NOT EXISTS "idx_users_auth_id" ON "users"("authId");

-- Index on user role (used in authorization checks)
CREATE INDEX IF NOT EXISTS "idx_users_role" ON "users"("role");

-- Index on timestamps for ordering
CREATE INDEX IF NOT EXISTS "idx_users_created_at" ON "users"("createdAt" DESC);
CREATE INDEX IF NOT EXISTS "idx_auths_created_at" ON "auths"("createdAt" DESC);


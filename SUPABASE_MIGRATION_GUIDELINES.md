# Supabase/Postgres Migration Guidelines

Important: Postgres does NOT support `ADD CONSTRAINT IF NOT EXISTS`. When adding constraints in migration scripts, always use a safe conditional DO block that checks `pg_constraint` and applies `ALTER TABLE ... ADD CONSTRAINT ...` only when the named constraint is not present.

Example pattern:

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'my_constraint_name') THEN
    ALTER TABLE my_table
      ADD CONSTRAINT my_constraint_name FOREIGN KEY (col) REFERENCES other_table(id) ON DELETE CASCADE;
  END IF;
END$$;

Follow this pattern for all `ADD CONSTRAINT` migrations to avoid syntax errors and make migrations idempotent.

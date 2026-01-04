-- Add snake_case user_id to notifications and migrate existing data
BEGIN;

ALTER TABLE notifications
  ADD COLUMN IF NOT EXISTS user_id UUID;

-- Only perform the backfill if the legacy "userId" column exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notifications' AND column_name = 'userId') THEN
    UPDATE notifications
      SET user_id = "userId"::UUID
      WHERE user_id IS NULL AND "userId" IS NOT NULL;
  END IF;
END$$;

-- Add foreign key constraint (if not already constrained)
ALTER TABLE notifications
  DROP CONSTRAINT IF EXISTS notifications_userid_fkey;

-- Add the foreign key constraint only if it does not already exist (Postgres doesn't support ADD CONSTRAINT IF NOT EXISTS)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'notifications_user_id_fkey') THEN
    ALTER TABLE notifications
      ADD CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
  END IF;
END$$;

-- Create index on new column for performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_id_snake ON notifications(user_id);

-- Recreate RLS policies to reference snake_case user_id
DROP POLICY IF EXISTS "Users can view own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON notifications;

CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT
  USING (auth.uid()::text = COALESCE(user_id::text, ''));

CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE
  USING (auth.uid()::text = COALESCE(user_id::text, ''));

-- Allow trusted server inserts (e.g., service role) — keep open for system use
DROP POLICY IF EXISTS "Allow notification inserts" ON notifications;
CREATE POLICY "Allow notification inserts"
  ON notifications FOR INSERT
  WITH CHECK (true);

COMMIT;

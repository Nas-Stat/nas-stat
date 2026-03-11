-- Add categories table for report categories
-- RLS: SELECT public, INSERT/UPDATE/DELETE admin only

CREATE TABLE IF NOT EXISTS categories (
  id         SERIAL PRIMARY KEY,
  slug       TEXT UNIQUE NOT NULL,
  label      TEXT NOT NULL,
  sort_order INT DEFAULT 0
);

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- Public read
CREATE POLICY "categories_select_public"
  ON categories FOR SELECT
  USING (true);

-- Admin-only write (reuses the admins table from prior migration)
CREATE POLICY "categories_insert_admin"
  ON categories FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM admins WHERE user_id = auth.uid())
  );

CREATE POLICY "categories_update_admin"
  ON categories FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM admins WHERE user_id = auth.uid())
  );

CREATE POLICY "categories_delete_admin"
  ON categories FOR DELETE
  USING (
    EXISTS (SELECT 1 FROM admins WHERE user_id = auth.uid())
  );

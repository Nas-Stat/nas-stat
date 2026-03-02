-- Make location optional on reports (issue #36)
ALTER TABLE reports ALTER COLUMN location DROP NOT NULL;

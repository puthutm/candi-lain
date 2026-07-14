CREATE TABLE IF NOT EXISTS "users_migration_photo_url" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "photo_url" text
);

-- Add photo_url column to users table if it doesn't exist
DO $$ 
BEGIN 
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'photo_url'
  ) THEN
    ALTER TABLE "users" ADD COLUMN "photo_url" text;
  END IF;
END $$;

-- Create uploads directory structure (if needed by the app)
-- This would typically be done at the application level

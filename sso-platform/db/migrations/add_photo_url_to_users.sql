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

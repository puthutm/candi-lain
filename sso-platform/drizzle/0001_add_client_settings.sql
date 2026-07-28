ALTER TABLE "applications" ADD COLUMN IF NOT EXISTS "is_public_client" boolean DEFAULT false NOT NULL;
ALTER TABLE "applications" ADD COLUMN IF NOT EXISTS "access_token_lifetime" integer;
ALTER TABLE "applications" ADD COLUMN IF NOT EXISTS "refresh_token_lifetime" integer;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "photo_url" text;

CREATE TABLE IF NOT EXISTS "password_reset_tokens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"token" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"used" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "password_reset_tokens_token_unique" UNIQUE("token")
);

DO $$ BEGIN
 ALTER TABLE "password_reset_tokens" ADD CONSTRAINT "password_reset_tokens_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

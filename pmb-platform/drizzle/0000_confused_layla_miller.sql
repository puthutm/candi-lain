CREATE TABLE "pmb_applicant_documents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"applicant_id" uuid NOT NULL,
	"document_type_id" uuid NOT NULL,
	"file_url" text NOT NULL,
	"status" text DEFAULT 'belum_upload' NOT NULL,
	"revision_note" text,
	"verified_by_staff_id" uuid,
	"verified_at" timestamp with time zone,
	"uploaded_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pmb_applicant_profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"applicant_id" uuid NOT NULL,
	"nik" text NOT NULL,
	"birth_place" text NOT NULL,
	"birth_date" date NOT NULL,
	"gender" text NOT NULL,
	"address" text NOT NULL,
	"parent_name" text NOT NULL,
	"photo_url" text,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "pmb_applicant_profiles_applicant_id_unique" UNIQUE("applicant_id")
);
--> statement-breakpoint
CREATE TABLE "pmb_applicant_status_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"applicant_id" uuid NOT NULL,
	"from_stage" text NOT NULL,
	"to_stage" text NOT NULL,
	"changed_by_staff_id" uuid,
	"note" text,
	"changed_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pmb_applicants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"registration_number" text NOT NULL,
	"full_name" text NOT NULL,
	"email" text NOT NULL,
	"phone" text NOT NULL,
	"password_hash" text NOT NULL,
	"wave_id" uuid NOT NULL,
	"entry_path_id" uuid NOT NULL,
	"study_program_id" uuid NOT NULL,
	"current_stage" text DEFAULT 'peminat' NOT NULL,
	"payment_status" text DEFAULT 'belum_bayar' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "pmb_applicants_registration_number_unique" UNIQUE("registration_number"),
	CONSTRAINT "pmb_applicants_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "pmb_document_types" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"code" text NOT NULL,
	"is_required" boolean DEFAULT true NOT NULL,
	"applies_to_rule" jsonb,
	CONSTRAINT "pmb_document_types_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "pmb_automation_workflows" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"trigger_event" text NOT NULL,
	"delay_minutes" integer DEFAULT 0 NOT NULL,
	"message_template_id" uuid NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pmb_campaigns" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"segment_filter" jsonb,
	"channel" text NOT NULL,
	"scheduled_at" timestamp with time zone,
	"status" text DEFAULT 'draft' NOT NULL,
	"sent_count" integer DEFAULT 0 NOT NULL,
	"opened_count" integer DEFAULT 0 NOT NULL,
	"clicked_count" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pmb_message_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"applicant_id" uuid NOT NULL,
	"message_template_id" uuid,
	"campaign_id" uuid,
	"channel" text NOT NULL,
	"status" text NOT NULL,
	"sent_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pmb_message_templates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"trigger_event" text NOT NULL,
	"channel" text NOT NULL,
	"subject" text,
	"body" text NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pmb_exam_answers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"exam_session_id" uuid NOT NULL,
	"exam_question_id" uuid NOT NULL,
	"answer_value" text NOT NULL,
	"answered_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pmb_exam_modules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"code" text NOT NULL,
	"duration_minutes" integer NOT NULL,
	"type" text NOT NULL,
	"question_count" integer NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	CONSTRAINT "pmb_exam_modules_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "pmb_exam_questions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"exam_module_id" uuid NOT NULL,
	"question_text" text NOT NULL,
	"question_type" text DEFAULT 'pilihan_ganda' NOT NULL,
	"options" jsonb NOT NULL,
	"correct_answer" text NOT NULL,
	"image_url" text
);
--> statement-breakpoint
CREATE TABLE "pmb_exam_results" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"applicant_id" uuid NOT NULL,
	"exam_module_id" uuid NOT NULL,
	"score" numeric(5, 2) NOT NULL,
	"passed" boolean DEFAULT false NOT NULL,
	"graded_by_staff_id" uuid,
	"graded_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "pmb_exam_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"applicant_id" uuid NOT NULL,
	"exam_module_id" uuid NOT NULL,
	"status" text DEFAULT 'belum_dikerjakan' NOT NULL,
	"started_at" timestamp with time zone,
	"submitted_at" timestamp with time zone,
	"time_remaining_seconds" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pmb_entry_paths" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"code" text NOT NULL,
	"form_fee" numeric(12, 2) DEFAULT '0.00' NOT NULL,
	"is_free" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "pmb_entry_paths_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "pmb_quotas" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"wave_id" uuid NOT NULL,
	"study_program_id" uuid NOT NULL,
	"quota_total" integer DEFAULT 0 NOT NULL,
	"quota_filled" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pmb_study_programs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"code" text NOT NULL,
	"faculty" text NOT NULL,
	"degree_level" text DEFAULT 'S1' NOT NULL,
	CONSTRAINT "pmb_study_programs_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "pmb_waves" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"code" text NOT NULL,
	"start_date" date NOT NULL,
	"end_date" date NOT NULL,
	"status" text DEFAULT 'belum_dibuka' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "pmb_waves_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "pmb_invoices" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"applicant_id" uuid NOT NULL,
	"invoice_number" text NOT NULL,
	"invoice_type" text NOT NULL,
	"amount" numeric(12, 2) NOT NULL,
	"status" text DEFAULT 'unpaid' NOT NULL,
	"due_date" date NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "pmb_invoices_invoice_number_unique" UNIQUE("invoice_number")
);
--> statement-breakpoint
CREATE TABLE "pmb_payment_transactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"invoice_id" uuid NOT NULL,
	"method" text NOT NULL,
	"provider_ref" text NOT NULL,
	"amount" numeric(12, 2) NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"webhook_payload" jsonb,
	"paid_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "application_roles" (
	"id" uuid PRIMARY KEY NOT NULL,
	"application_id" uuid NOT NULL,
	"role_key" text NOT NULL,
	"role_name" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "applications" (
	"id" uuid PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"client_id" text NOT NULL,
	CONSTRAINT "applications_client_id_unique" UNIQUE("client_id")
);
--> statement-breakpoint
CREATE TABLE "oauth_authorization_codes" (
	"id" uuid PRIMARY KEY NOT NULL,
	"code" text NOT NULL,
	"user_id" uuid NOT NULL,
	"application_id" uuid NOT NULL,
	"redirect_uri" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"used" boolean DEFAULT false NOT NULL,
	CONSTRAINT "oauth_authorization_codes_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "user_application_roles" (
	"id" uuid PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"application_id" uuid NOT NULL,
	"role_id" uuid NOT NULL,
	"status" text DEFAULT 'active' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY NOT NULL,
	"username" text NOT NULL,
	"email" text NOT NULL,
	"password_hash" text NOT NULL,
	"full_name" text NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	CONSTRAINT "users_username_unique" UNIQUE("username"),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "pmb_applicant_documents" ADD CONSTRAINT "pmb_applicant_documents_applicant_id_pmb_applicants_id_fk" FOREIGN KEY ("applicant_id") REFERENCES "public"."pmb_applicants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pmb_applicant_documents" ADD CONSTRAINT "pmb_applicant_documents_document_type_id_pmb_document_types_id_fk" FOREIGN KEY ("document_type_id") REFERENCES "public"."pmb_document_types"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pmb_applicant_profiles" ADD CONSTRAINT "pmb_applicant_profiles_applicant_id_pmb_applicants_id_fk" FOREIGN KEY ("applicant_id") REFERENCES "public"."pmb_applicants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pmb_applicant_status_history" ADD CONSTRAINT "pmb_applicant_status_history_applicant_id_pmb_applicants_id_fk" FOREIGN KEY ("applicant_id") REFERENCES "public"."pmb_applicants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pmb_applicants" ADD CONSTRAINT "pmb_applicants_wave_id_pmb_waves_id_fk" FOREIGN KEY ("wave_id") REFERENCES "public"."pmb_waves"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pmb_applicants" ADD CONSTRAINT "pmb_applicants_entry_path_id_pmb_entry_paths_id_fk" FOREIGN KEY ("entry_path_id") REFERENCES "public"."pmb_entry_paths"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pmb_applicants" ADD CONSTRAINT "pmb_applicants_study_program_id_pmb_study_programs_id_fk" FOREIGN KEY ("study_program_id") REFERENCES "public"."pmb_study_programs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pmb_automation_workflows" ADD CONSTRAINT "pmb_automation_workflows_message_template_id_pmb_message_templates_id_fk" FOREIGN KEY ("message_template_id") REFERENCES "public"."pmb_message_templates"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pmb_message_logs" ADD CONSTRAINT "pmb_message_logs_applicant_id_pmb_applicants_id_fk" FOREIGN KEY ("applicant_id") REFERENCES "public"."pmb_applicants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pmb_message_logs" ADD CONSTRAINT "pmb_message_logs_message_template_id_pmb_message_templates_id_fk" FOREIGN KEY ("message_template_id") REFERENCES "public"."pmb_message_templates"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pmb_message_logs" ADD CONSTRAINT "pmb_message_logs_campaign_id_pmb_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."pmb_campaigns"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pmb_exam_answers" ADD CONSTRAINT "pmb_exam_answers_exam_session_id_pmb_exam_sessions_id_fk" FOREIGN KEY ("exam_session_id") REFERENCES "public"."pmb_exam_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pmb_exam_answers" ADD CONSTRAINT "pmb_exam_answers_exam_question_id_pmb_exam_questions_id_fk" FOREIGN KEY ("exam_question_id") REFERENCES "public"."pmb_exam_questions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pmb_exam_questions" ADD CONSTRAINT "pmb_exam_questions_exam_module_id_pmb_exam_modules_id_fk" FOREIGN KEY ("exam_module_id") REFERENCES "public"."pmb_exam_modules"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pmb_exam_results" ADD CONSTRAINT "pmb_exam_results_applicant_id_pmb_applicants_id_fk" FOREIGN KEY ("applicant_id") REFERENCES "public"."pmb_applicants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pmb_exam_results" ADD CONSTRAINT "pmb_exam_results_exam_module_id_pmb_exam_modules_id_fk" FOREIGN KEY ("exam_module_id") REFERENCES "public"."pmb_exam_modules"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pmb_exam_sessions" ADD CONSTRAINT "pmb_exam_sessions_applicant_id_pmb_applicants_id_fk" FOREIGN KEY ("applicant_id") REFERENCES "public"."pmb_applicants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pmb_exam_sessions" ADD CONSTRAINT "pmb_exam_sessions_exam_module_id_pmb_exam_modules_id_fk" FOREIGN KEY ("exam_module_id") REFERENCES "public"."pmb_exam_modules"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pmb_quotas" ADD CONSTRAINT "pmb_quotas_wave_id_pmb_waves_id_fk" FOREIGN KEY ("wave_id") REFERENCES "public"."pmb_waves"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pmb_quotas" ADD CONSTRAINT "pmb_quotas_study_program_id_pmb_study_programs_id_fk" FOREIGN KEY ("study_program_id") REFERENCES "public"."pmb_study_programs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pmb_invoices" ADD CONSTRAINT "pmb_invoices_applicant_id_pmb_applicants_id_fk" FOREIGN KEY ("applicant_id") REFERENCES "public"."pmb_applicants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pmb_payment_transactions" ADD CONSTRAINT "pmb_payment_transactions_invoice_id_pmb_invoices_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "public"."pmb_invoices"("id") ON DELETE cascade ON UPDATE no action;
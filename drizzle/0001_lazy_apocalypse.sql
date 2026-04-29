CREATE TYPE "public"."fund_deposit_status" AS ENUM('pending', 'approved', 'rejected');--> statement-breakpoint
CREATE TABLE "fund_deposits" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"fund_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"amount" integer NOT NULL,
	"currency" text DEFAULT 'USD' NOT NULL,
	"notes" text,
	"status" "fund_deposit_status" DEFAULT 'pending' NOT NULL,
	"reviewed_by" uuid,
	"reviewed_at" timestamp,
	"review_notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "deposit_funds" ADD COLUMN "bank_name" text;--> statement-breakpoint
ALTER TABLE "deposit_funds" ADD COLUMN "bank_account_name" text;--> statement-breakpoint
ALTER TABLE "deposit_funds" ADD COLUMN "bank_account_number" text;--> statement-breakpoint
ALTER TABLE "deposit_funds" ADD COLUMN "bank_routing_number" text;--> statement-breakpoint
ALTER TABLE "deposit_funds" ADD COLUMN "bank_swift_code" text;--> statement-breakpoint
ALTER TABLE "deposit_funds" ADD COLUMN "bank_instructions" text;--> statement-breakpoint
ALTER TABLE "fund_deposits" ADD CONSTRAINT "fund_deposits_fund_id_deposit_funds_id_fk" FOREIGN KEY ("fund_id") REFERENCES "public"."deposit_funds"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fund_deposits" ADD CONSTRAINT "fund_deposits_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fund_deposits" ADD CONSTRAINT "fund_deposits_reviewed_by_users_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "event_plans" ADD COLUMN "includes_digital" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "event_plans" ADD COLUMN "includes_print" boolean DEFAULT true NOT NULL;
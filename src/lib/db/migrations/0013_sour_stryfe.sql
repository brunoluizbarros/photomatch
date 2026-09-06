ALTER TABLE "event_plans" ADD COLUMN "extra_digital_price_cents" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "event_plans" ADD COLUMN "extra_print_price_cents" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "events" DROP COLUMN "digital_unit_price_cents";--> statement-breakpoint
ALTER TABLE "events" DROP COLUMN "print_unit_price_cents";
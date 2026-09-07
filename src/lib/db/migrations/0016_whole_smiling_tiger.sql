CREATE TYPE "public"."print_size" AS ENUM('5x7', 'polaroid', '10x15', '15x20');--> statement-breakpoint
ALTER TABLE "order_items" ADD COLUMN "print_size" "print_size";--> statement-breakpoint
ALTER TABLE "order_items" ADD COLUMN "printed_by" text;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_printed_by_user_id_fk" FOREIGN KEY ("printed_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;
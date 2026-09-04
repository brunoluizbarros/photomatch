ALTER TABLE "events" ADD COLUMN "photographers_see_all_photos" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "photographers_can_create_albums" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "albums" ADD COLUMN "created_by" text;--> statement-breakpoint
ALTER TABLE "albums" ADD CONSTRAINT "albums_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;

CREATE TYPE "public"."access_request_status" AS ENUM('pending', 'approved', 'rejected');--> statement-breakpoint
CREATE TABLE "access_requests" (
	"id" text PRIMARY KEY NOT NULL,
	"album_id" text NOT NULL,
	"name" text,
	"email" text NOT NULL,
	"phone" text NOT NULL,
	"status" "access_request_status" DEFAULT 'pending' NOT NULL,
	"email_sent_at" timestamp with time zone,
	"whatsapp_sent_at" timestamp with time zone,
	"responded_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "access_requests" ADD CONSTRAINT "access_requests_album_id_albums_id_fk" FOREIGN KEY ("album_id") REFERENCES "public"."albums"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "access_requests_album_id_status_idx" ON "access_requests" USING btree ("album_id","status");
CREATE TYPE "public"."photo_index_status" AS ENUM('awaiting_upload', 'pending', 'processing', 'indexed', 'failed');--> statement-breakpoint
CREATE TABLE "albums" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"event_date" timestamp with time zone,
	"is_published" boolean DEFAULT false NOT NULL,
	"rekognition_collection_id" text NOT NULL,
	"hero_image_url" text,
	"logo_url" text,
	"primary_color" text DEFAULT '#c0714a' NOT NULL,
	"welcome_message" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "albums_slug_unique" UNIQUE("slug"),
	CONSTRAINT "albums_rekognition_collection_id_unique" UNIQUE("rekognition_collection_id")
);
--> statement-breakpoint
CREATE TABLE "account" (
	"id" text PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" text NOT NULL,
	"issuer" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp,
	"refresh_token_expires_at" timestamp,
	"scope" text,
	"password" text,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" text PRIMARY KEY NOT NULL,
	"expires_at" timestamp NOT NULL,
	"token" text NOT NULL,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" text NOT NULL,
	CONSTRAINT "session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean NOT NULL,
	"image" text,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL,
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp,
	"updated_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "photos" (
	"id" text PRIMARY KEY NOT NULL,
	"album_id" text NOT NULL,
	"storage_key" text NOT NULL,
	"width" integer,
	"height" integer,
	"bytes" integer,
	"status" "photo_index_status" DEFAULT 'awaiting_upload' NOT NULL,
	"face_count" integer DEFAULT 0 NOT NULL,
	"unindexed_face_count" integer DEFAULT 0 NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"last_error" text,
	"leased_at" timestamp with time zone,
	"indexed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "photos_storage_key_unique" UNIQUE("storage_key")
);
--> statement-breakpoint
CREATE TABLE "photo_faces" (
	"id" text PRIMARY KEY NOT NULL,
	"photo_id" text NOT NULL,
	"album_id" text NOT NULL,
	"rekognition_face_id" text NOT NULL,
	"bounding_box" jsonb NOT NULL,
	"confidence" double precision NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "photo_faces_rekognition_face_id_unique" UNIQUE("rekognition_face_id")
);
--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "photos" ADD CONSTRAINT "photos_album_id_albums_id_fk" FOREIGN KEY ("album_id") REFERENCES "public"."albums"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "photo_faces" ADD CONSTRAINT "photo_faces_photo_id_photos_id_fk" FOREIGN KEY ("photo_id") REFERENCES "public"."photos"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "photo_faces" ADD CONSTRAINT "photo_faces_album_id_albums_id_fk" FOREIGN KEY ("album_id") REFERENCES "public"."albums"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "photos_album_id_status_idx" ON "photos" USING btree ("album_id","status");--> statement-breakpoint
CREATE INDEX "photo_faces_photo_id_idx" ON "photo_faces" USING btree ("photo_id");
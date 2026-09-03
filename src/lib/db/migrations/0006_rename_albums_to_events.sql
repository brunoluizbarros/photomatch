ALTER TABLE "albums" RENAME TO "events";--> statement-breakpoint
ALTER TABLE "photos" RENAME COLUMN "album_id" TO "event_id";--> statement-breakpoint
ALTER TABLE "photo_faces" RENAME COLUMN "album_id" TO "event_id";--> statement-breakpoint
ALTER TABLE "analytics_events" RENAME COLUMN "album_id" TO "event_id";--> statement-breakpoint
ALTER TABLE "access_requests" RENAME COLUMN "album_id" TO "event_id";--> statement-breakpoint
ALTER TABLE "events" RENAME CONSTRAINT "albums_slug_unique" TO "events_slug_unique";--> statement-breakpoint
ALTER TABLE "events" RENAME CONSTRAINT "albums_rekognition_collection_id_unique" TO "events_rekognition_collection_id_unique";--> statement-breakpoint
ALTER TABLE "photos" RENAME CONSTRAINT "photos_album_id_albums_id_fk" TO "photos_event_id_events_id_fk";--> statement-breakpoint
ALTER TABLE "photo_faces" RENAME CONSTRAINT "photo_faces_album_id_albums_id_fk" TO "photo_faces_event_id_events_id_fk";--> statement-breakpoint
ALTER TABLE "analytics_events" RENAME CONSTRAINT "analytics_events_album_id_albums_id_fk" TO "analytics_events_event_id_events_id_fk";--> statement-breakpoint
ALTER TABLE "access_requests" RENAME CONSTRAINT "access_requests_album_id_albums_id_fk" TO "access_requests_event_id_events_id_fk";--> statement-breakpoint
ALTER INDEX "photos_album_id_status_idx" RENAME TO "photos_event_id_status_idx";--> statement-breakpoint
ALTER INDEX "analytics_events_album_id_created_at_idx" RENAME TO "analytics_events_event_id_created_at_idx";--> statement-breakpoint
ALTER INDEX "access_requests_album_id_status_idx" RENAME TO "access_requests_event_id_status_idx";

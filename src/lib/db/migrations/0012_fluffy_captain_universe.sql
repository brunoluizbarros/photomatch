ALTER TABLE "access_requests" ADD COLUMN "token" text;--> statement-breakpoint
ALTER TABLE "access_requests" ADD CONSTRAINT "access_requests_token_unique" UNIQUE("token");
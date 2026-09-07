CREATE TABLE "event_categories" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "event_categories_name_unique" UNIQUE("name")
);
--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "category_id" text;--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_category_id_event_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."event_categories"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
-- Seed inicial do cadastro de categorias (ids fixos e legíveis — cadastro do
-- sistema, não algo o admin cria hoje, então não faz sentido usar cuid).
INSERT INTO "event_categories" ("id", "name") VALUES
	('casamento', 'Casamento'),
	('infantil', 'Infantil'),
	('bem-estar', 'Bem-estar'),
	('corporativo', 'Corporativo'),
	('formatura', 'Formatura'),
	('ensaio', 'Ensaio fotográfico'),
	('esportivo', 'Esportivo'),
	('religioso', 'Religioso'),
	('show', 'Show/Balada'),
	('outro', 'Outro')
ON CONFLICT ("id") DO NOTHING;--> statement-breakpoint
-- Backfill: eventos criados antes desta coluna existir não tinham categoria
-- pra escolher — caem em 'outro' até o admin recategorizar manualmente.
UPDATE "events" SET "category_id" = 'outro' WHERE "category_id" IS NULL;--> statement-breakpoint
ALTER TABLE "events" ALTER COLUMN "category_id" SET NOT NULL;
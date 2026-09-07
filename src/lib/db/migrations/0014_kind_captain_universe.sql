ALTER TABLE "events" ALTER COLUMN "primary_color" SET DEFAULT 'clay';--> statement-breakpoint
-- Backfill: eventos que nunca tiveram a cor escolhida no form de personalização
-- ficaram com o hex cru do default antigo da coluna, que getAccentPreset()
-- não reconhece (só aceita id de preset) — caía sempre no violeta padrão.
-- 'clay' é o preset cujo solid (#c0714a) é esse mesmo hex.
UPDATE "events" SET "primary_color" = 'clay' WHERE "primary_color" = '#c0714a';
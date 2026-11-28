BEGIN;

-- Convert whySpecial from TEXT to TEXT[]
ALTER TABLE "event_venues"
ALTER COLUMN "whySpecial" TYPE TEXT[]
USING (
    CASE
        WHEN "whySpecial" IS NULL
            THEN ARRAY[]::TEXT[]
        ELSE ARRAY["whySpecial"]::TEXT[]
    END
);

ALTER TABLE "event_venues"
ALTER COLUMN "whySpecial"
SET DEFAULT ARRAY[]::TEXT[];


-- Convert afterEventLine from TEXT to TEXT[]
ALTER TABLE "events"
ALTER COLUMN "afterEventLine" TYPE TEXT[]
USING (
    CASE
        WHEN "afterEventLine" IS NULL
            THEN ARRAY[]::TEXT[]
        ELSE ARRAY["afterEventLine"]::TEXT[]
    END
);

ALTER TABLE "events"
ALTER COLUMN "afterEventLine"
SET DEFAULT ARRAY[]::TEXT[];

COMMIT;
ALTER TABLE "your_events"
    ALTER COLUMN "eventDurationType" DROP NOT NULL,
    ALTER COLUMN "baseCity" DROP NOT NULL,
    ALTER COLUMN "targetAudience" DROP NOT NULL;

INSERT INTO "partner_event_categories" ("id", "label", "value", "icon", "sortOrder", "updatedAt")
VALUES
    (gen_random_uuid(), 'Singles Meetup', 'SINGLES_MEETUP', '💗', 1, CURRENT_TIMESTAMP),
    (gen_random_uuid(), 'Trekking', 'TREKKING', '🥾', 2, CURRENT_TIMESTAMP),
    (gen_random_uuid(), 'Travel & Trips', 'TRAVEL_AND_TRIPS', '✈️', 3, CURRENT_TIMESTAMP),
    (gen_random_uuid(), 'Couples', 'COUPLES', '💑', 4, CURRENT_TIMESTAMP),
    (gen_random_uuid(), 'Parties & Nightlife', 'PARTIES_AND_NIGHTLIFE', '🎉', 5, CURRENT_TIMESTAMP),
    (gen_random_uuid(), 'Creative Activities', 'CREATIVE_ACTIVITIES', '🎨', 6, CURRENT_TIMESTAMP),
    (gen_random_uuid(), 'Camping & Adventure', 'CAMPING_AND_ADVENTURE', '🏕️', 7, CURRENT_TIMESTAMP),
    (gen_random_uuid(), 'Games & Fun', 'GAMES_AND_FUN', '🎮', 8, CURRENT_TIMESTAMP)
ON CONFLICT ("value") DO NOTHING;

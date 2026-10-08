CREATE EXTENSION IF NOT EXISTS postgis WITH SCHEMA public;

ALTER TABLE "user_profiles"
ADD COLUMN "location" geography(Point,4326);

UPDATE "user_profiles"
SET "location" = ST_SetSRID(
  ST_MakePoint(
    "longitude"::double precision,
    "latitude"::double precision
  ),
  4326
)::geography
WHERE "latitude" IS NOT NULL
  AND "longitude" IS NOT NULL
  AND "latitude" BETWEEN -90 AND 90
  AND "longitude" BETWEEN -180 AND 180;

CREATE INDEX "user_profiles_location_idx"
ON "user_profiles"
USING GIST ("location");
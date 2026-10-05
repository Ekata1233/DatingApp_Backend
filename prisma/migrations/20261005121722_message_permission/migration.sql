-- Remove scalar default first
ALTER TABLE "UserPrivacySettings"
ALTER COLUMN "messagePermission" DROP DEFAULT;

-- Convert existing scalar enum value into an enum array
ALTER TABLE "UserPrivacySettings"
ALTER COLUMN "messagePermission"
TYPE "MessagePermission"[]
USING ARRAY["messagePermission"]::"MessagePermission"[];

-- Set the new array default
ALTER TABLE "UserPrivacySettings"
ALTER COLUMN "messagePermission"
SET DEFAULT ARRAY['MATCHES_ONLY']::"MessagePermission"[];
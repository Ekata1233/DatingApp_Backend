-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "name" VARCHAR(100),
    "phone_number" VARCHAR(20),
    "google_id" VARCHAR(255),
    "is_phone_verified" BOOLEAN NOT NULL DEFAULT false,
    "onboarding_step" INTEGER NOT NULL DEFAULT 1,
    "onboarding_completed" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_profiles" (
    "user_id" UUID NOT NULL,
    "birth_date" DATE,
    "gender" VARCHAR(30),
    "sexual_orientation" VARCHAR(50),
    "interested_in" VARCHAR(30),
    "looking_for" VARCHAR(50),
    "max_distance_km" INTEGER,
    "latitude" DECIMAL(10,8),
    "longitude" DECIMAL(11,8),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_profiles_pkey" PRIMARY KEY ("user_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_phone_number_key" ON "users"("phone_number");

-- CreateIndex
CREATE INDEX "users_google_id_idx" ON "users"("google_id");

-- CreateIndex
CREATE INDEX "user_profiles_gender_idx" ON "user_profiles"("gender");

-- CreateIndex
CREATE INDEX "user_profiles_sexual_orientation_idx" ON "user_profiles"("sexual_orientation");

-- CreateIndex
CREATE INDEX "user_profiles_interested_in_idx" ON "user_profiles"("interested_in");

-- CreateIndex
CREATE INDEX "user_profiles_looking_for_idx" ON "user_profiles"("looking_for");

-- CreateIndex
CREATE INDEX "user_profiles_birth_date_idx" ON "user_profiles"("birth_date");

-- CreateIndex
CREATE INDEX "user_profiles_latitude_longitude_idx" ON "user_profiles"("latitude", "longitude");

-- CreateIndex
CREATE INDEX "user_profiles_gender_interested_in_idx" ON "user_profiles"("gender", "interested_in");

-- AddForeignKey
ALTER TABLE "user_profiles" ADD CONSTRAINT "user_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

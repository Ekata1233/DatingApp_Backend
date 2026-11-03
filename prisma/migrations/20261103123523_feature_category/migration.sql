-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "FeatureCategory" ADD VALUE 'STAND_OUT_INSTANTLY';
ALTER TYPE "FeatureCategory" ADD VALUE 'MEET_IN_REAL_LIFE';
ALTER TYPE "FeatureCategory" ADD VALUE 'REWARDS_FOR_SERIOUS_DATERS';
ALTER TYPE "FeatureCategory" ADD VALUE 'VIP_PERKS';
ALTER TYPE "FeatureCategory" ADD VALUE 'EVERYTHING_IN_VIP_AND_MORE';
ALTER TYPE "FeatureCategory" ADD VALUE 'ABSOLUTE_PRIVACY';
ALTER TYPE "FeatureCategory" ADD VALUE 'SMARTER_CURATED_MATCHES';
ALTER TYPE "FeatureCategory" ADD VALUE 'STATUS_THAT_SPEAKS_FIRST';
ALTER TYPE "FeatureCategory" ADD VALUE 'WHITE_GLOVE_DATING';
ALTER TYPE "FeatureCategory" ADD VALUE 'THE_WORLD_CURATED';
ALTER TYPE "FeatureCategory" ADD VALUE 'AN_EXECUTIVE_CIRCLE';

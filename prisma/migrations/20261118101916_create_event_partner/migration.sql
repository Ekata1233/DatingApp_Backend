-- CreateEnum
CREATE TYPE "PartnerStatus" AS ENUM ('ACTIVE', 'SUSPENDED', 'DELETED');

-- CreateEnum
CREATE TYPE "BusinessStatus" AS ENUM ('DRAFT', 'UNDER_REVIEW', 'CHANGES_REQUIRED', 'AGREEMENT_PENDING', 'ACTIVE', 'REJECTED', 'SUSPENDED', 'TERMINATED');

-- CreateEnum
CREATE TYPE "OrganizerStep" AS ENUM ('PERSONAL_DETAILS', 'BUSINESS_DETAILS', 'VERIFY_ID', 'YOUR_EVENTS', 'UNDER_REVIEW', 'AGREEMENT', 'COMPLETED');

-- CreateEnum
CREATE TYPE "HostStep" AS ENUM ('INVITE_ACCEPTANCE', 'PERSONAL_DETAILS', 'VERIFY_ID', 'VERIFICATION', 'CODE_OF_CONDUCT', 'COMPLETED');

-- CreateEnum
CREATE TYPE "HostStatus" AS ENUM ('INVITED', 'ONBOARDING', 'ACTIVE', 'PAUSED', 'DECLINED', 'EXPIRED', 'REMOVED');

-- CreateEnum
CREATE TYPE "PartnerVerificationStatus" AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'UNDER_REVIEW', 'VERIFIED', 'FAILED', 'REJECTED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "BusinessConstitution" AS ENUM ('INDIVIDUAL', 'SOLE_PROPRIETORSHIP', 'PARTNERSHIP', 'LLP', 'PRIVATE_LIMITED', 'PUBLIC_LIMITED', 'ONE_PERSON_COMPANY', 'HUF', 'TRUST', 'SOCIETY', 'OTHER');

-- CreateEnum
CREATE TYPE "RegistrationType" AS ENUM ('CIN', 'LLPIN');

-- CreateEnum
CREATE TYPE "RepresentativeDesignation" AS ENUM ('OWNER', 'MANAGER', 'PARTNER', 'DESIGNATED_PARTNER', 'DIRECTOR', 'AUTHORISED_PERSON');

-- CreateEnum
CREATE TYPE "EventDurationType" AS ENUM ('SINGLE_DAY', 'MULTI_DAY', 'BOTH');

-- CreateEnum
CREATE TYPE "EventAudience" AS ENUM ('FREE_PREMIUM', 'VIP_ELITE', 'BOTH');

-- CreateEnum
CREATE TYPE "ApprovalStatus" AS ENUM ('NOT_REQUESTED', 'PENDING', 'APPROVED', 'REJECTED', 'CHANGES_REQUIRED');

-- CreateEnum
CREATE TYPE "HostGender" AS ENUM ('MAN', 'WOMAN', 'PREFER_NOT_TO_SAY');

-- CreateEnum
CREATE TYPE "AgreementStatus" AS ENUM ('PENDING', 'SIGNED', 'FAILED', 'EXPIRED', 'TERMINATED');

-- CreateEnum
CREATE TYPE "SignatureMethod" AS ENUM ('AADHAAR_ESIGN', 'DSC');

-- CreateEnum
CREATE TYPE "PayoutCycle" AS ENUM ('WEEKLY', 'BI_WEEKLY', 'MONTHLY');

-- CreateEnum
CREATE TYPE "InterviewStatus" AS ENUM ('NOT_REQUIRED', 'PENDING', 'SCHEDULED', 'COMPLETED', 'CANCELLED', 'NO_SHOW');

-- CreateEnum
CREATE TYPE "EventHostStatus" AS ENUM ('ACTIVE', 'REMOVED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "PartnerConsentType" AS ENUM ('VERIFICATION_CONSENT', 'WHATSAPP_UPDATES', 'GST_NON_REGISTRATION_DECLARATION', 'BUSINESS_DETAILS_CONFIRMATION', 'HOST_RULES', 'BACKGROUND_CHECK_CONSENT', 'AGREEMENT_ACCEPTANCE', 'SIGNING_AUTHORITY_DECLARATION', 'ESIGN_KYC_CONSENT', 'HOST_CODE_OF_CONDUCT', 'GUEST_DATA_PRIVACY', 'SAFETY_AND_POSH_RULES');

-- AlterTable
ALTER TABLE "Event" ADD COLUMN     "businessDetailsId" UUID;

-- CreateTable
CREATE TABLE "event_partners" (
    "id" UUID NOT NULL,
    "fullName" TEXT,
    "phoneNumber" TEXT NOT NULL,
    "isPhoneVerified" BOOLEAN NOT NULL DEFAULT false,
    "phoneVerifiedAt" TIMESTAMP(3),
    "email" TEXT,
    "isEmailVerified" BOOLEAN NOT NULL DEFAULT false,
    "emailVerifiedAt" TIMESTAMP(3),
    "gender" "HostGender",
    "languages" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "profilePhoto" TEXT,
    "whatsappUpdates" BOOLEAN NOT NULL DEFAULT false,
    "accountStatus" "PartnerStatus" NOT NULL DEFAULT 'ACTIVE',
    "sessionId" TEXT,
    "deviceToken" TEXT,
    "lastLoginAt" TIMESTAMP(3),
    "lastActiveAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "event_partners_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "business_details" (
    "id" UUID NOT NULL,
    "partnerId" UUID NOT NULL,
    "legalName" TEXT,
    "tradeName" TEXT,
    "brandName" TEXT,
    "constitution" "BusinessConstitution",
    "hasGst" BOOLEAN,
    "gstNumber" TEXT,
    "gstStatus" TEXT,
    "gstVerificationStatus" "PartnerVerificationStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "gstVerifiedAt" TIMESTAMP(3),
    "registeredSince" TIMESTAMP(3),
    "panNumberEncrypted" TEXT,
    "panLastFour" VARCHAR(4),
    "panName" TEXT,
    "panStatus" TEXT,
    "panCategory" TEXT,
    "panVerificationStatus" "PartnerVerificationStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "panVerifiedAt" TIMESTAMP(3),
    "isAadhaarLinked" BOOLEAN,
    "registrationType" "RegistrationType",
    "registrationNumber" TEXT,
    "incorporationDate" TIMESTAMP(3),
    "companyStatus" TEXT,
    "mcaVerificationStatus" "PartnerVerificationStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "mcaVerifiedAt" TIMESTAMP(3),
    "directorsOrPartners" JSONB,
    "principalPlace" TEXT,
    "state" TEXT,
    "registeredPincode" TEXT,
    "representativeName" TEXT,
    "designation" "RepresentativeDesignation",
    "isMcaNameMatched" BOOLEAN,
    "partnershipDeedKey" TEXT,
    "authorizationDocumentKey" TEXT,
    "authorizationStatus" "PartnerVerificationStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "businessConfirmedAt" TIMESTAMP(3),
    "logoUrl" TEXT,
    "coverPhotoUrl" TEXT,
    "tagline" TEXT,
    "description" TEXT,
    "instagramUrl" TEXT,
    "onboardingStep" "OrganizerStep" NOT NULL DEFAULT 'PERSONAL_DETAILS',
    "onboardingCompleted" BOOLEAN NOT NULL DEFAULT false,
    "status" "BusinessStatus" NOT NULL DEFAULT 'DRAFT',
    "submittedAt" TIMESTAMP(3),
    "approvedAt" TIMESTAMP(3),
    "activatedAt" TIMESTAMP(3),
    "rejectedAt" TIMESTAMP(3),
    "rejectionReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "business_details_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verify_ids" (
    "id" UUID NOT NULL,
    "businessId" UUID NOT NULL,
    "aadhaarLastFour" VARCHAR(4),
    "aadhaarName" TEXT,
    "dateOfBirth" DATE,
    "city" TEXT,
    "state" TEXT,
    "isAdult" BOOLEAN,
    "isNameMatched" BOOLEAN,
    "aadhaarStatus" "PartnerVerificationStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "aadhaarVerifiedAt" TIMESTAMP(3),
    "aadhaarReferenceId" TEXT,
    "panNumberEncrypted" TEXT,
    "panLastFour" VARCHAR(4),
    "panName" TEXT,
    "isPanNameMatched" BOOLEAN,
    "panStatus" "PartnerVerificationStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "panVerifiedAt" TIMESTAMP(3),
    "panReferenceId" TEXT,
    "selfieKey" TEXT,
    "faceMatchScore" DECIMAL(5,2),
    "livenessScore" DECIMAL(5,2),
    "isFaceMatched" BOOLEAN,
    "isLivenessPassed" BOOLEAN,
    "faceStatus" "PartnerVerificationStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "faceVerifiedAt" TIMESTAMP(3),
    "faceReferenceId" TEXT,
    "isAadhaarLinked" BOOLEAN,
    "aadhaarProvider" TEXT,
    "aadhaarFailureReason" TEXT,
    "panProvider" TEXT,
    "panFailureReason" TEXT,
    "faceProvider" TEXT,
    "faceFailureReason" TEXT,
    "livenessStatus" "PartnerVerificationStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "livenessVerifiedAt" TIMESTAMP(3),
    "livenessReferenceId" TEXT,
    "livenessProvider" TEXT,
    "livenessFailureReason" TEXT,
    "status" "PartnerVerificationStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "verifiedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "failureReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "verify_ids_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "your_events" (
    "id" UUID NOT NULL,
    "businessId" UUID NOT NULL,
    "eventDurationType" "EventDurationType" NOT NULL,
    "baseCity" TEXT NOT NULL,
    "hostingCities" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "targetAudience" "EventAudience" NOT NULL,
    "emergencyContactName" TEXT,
    "emergencyContactPhone" TEXT,
    "vipApprovalStatus" "ApprovalStatus" NOT NULL DEFAULT 'NOT_REQUESTED',
    "vipApprovedAt" TIMESTAMP(3),
    "vipRejectionReason" TEXT,
    "hasAgreedToHostRules" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "your_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "partner_event_categories" (
    "id" UUID NOT NULL,
    "label" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "icon" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "partner_event_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hosts" (
    "id" UUID NOT NULL,
    "businessId" UUID NOT NULL,
    "partnerId" UUID,
    "fullName" TEXT NOT NULL,
    "phoneNumber" TEXT NOT NULL,
    "email" TEXT,
    "gender" "HostGender",
    "languages" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "invitationTokenHash" TEXT,
    "invitedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "invitationExpiresAt" TIMESTAMP(3) NOT NULL,
    "acceptedAt" TIMESTAMP(3),
    "declinedAt" TIMESTAMP(3),
    "canViewGuestList" BOOLEAN NOT NULL DEFAULT true,
    "canCheckInGuests" BOOLEAN NOT NULL DEFAULT true,
    "canUpdateRunSheetProgress" BOOLEAN NOT NULL DEFAULT true,
    "canViewRoomList" BOOLEAN NOT NULL DEFAULT true,
    "canReportIncidentSOS" BOOLEAN NOT NULL DEFAULT true,
    "canMessageGuests" BOOLEAN NOT NULL DEFAULT true,
    "canReplyToReviews" BOOLEAN NOT NULL DEFAULT false,
    "canCreateSubmitEvent" BOOLEAN NOT NULL DEFAULT false,
    "canEditEvent" BOOLEAN NOT NULL DEFAULT false,
    "canCancelEventRefund" BOOLEAN NOT NULL DEFAULT false,
    "canManagePayouts" BOOLEAN NOT NULL DEFAULT false,
    "onboardingStep" "HostStep" NOT NULL DEFAULT 'INVITE_ACCEPTANCE',
    "onboardingCompleted" BOOLEAN NOT NULL DEFAULT false,
    "status" "HostStatus" NOT NULL DEFAULT 'INVITED',
    "emergencyContactName" TEXT,
    "emergencyContactPhone" TEXT,
    "joinedAt" TIMESTAMP(3),
    "pausedAt" TIMESTAMP(3),
    "removedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hosts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "host_verify_ids" (
    "id" UUID NOT NULL,
    "hostId" UUID NOT NULL,
    "aadhaarLastFour" VARCHAR(4),
    "aadhaarName" TEXT,
    "dateOfBirth" DATE,
    "city" TEXT,
    "state" TEXT,
    "isAdult" BOOLEAN,
    "isNameMatched" BOOLEAN,
    "aadhaarStatus" "PartnerVerificationStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "aadhaarVerifiedAt" TIMESTAMP(3),
    "aadhaarReferenceId" TEXT,
    "aadhaarProvider" TEXT,
    "aadhaarFailureReason" TEXT,
    "panNumberEncrypted" TEXT,
    "panLastFour" VARCHAR(4),
    "panName" TEXT,
    "panCategory" TEXT,
    "isPanNameMatched" BOOLEAN,
    "isAadhaarLinked" BOOLEAN,
    "panStatus" "PartnerVerificationStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "panVerifiedAt" TIMESTAMP(3),
    "panReferenceId" TEXT,
    "panProvider" TEXT,
    "panFailureReason" TEXT,
    "selfieKey" TEXT,
    "faceMatchScore" DECIMAL(5,2),
    "isFaceMatched" BOOLEAN,
    "faceStatus" "PartnerVerificationStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "faceVerifiedAt" TIMESTAMP(3),
    "faceReferenceId" TEXT,
    "faceProvider" TEXT,
    "faceFailureReason" TEXT,
    "livenessScore" DECIMAL(5,2),
    "isLivenessPassed" BOOLEAN,
    "livenessStatus" "PartnerVerificationStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "livenessVerifiedAt" TIMESTAMP(3),
    "livenessReferenceId" TEXT,
    "livenessProvider" TEXT,
    "livenessFailureReason" TEXT,
    "status" "PartnerVerificationStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "verifiedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "failureReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "host_verify_ids_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "partner_consents" (
    "id" UUID NOT NULL,
    "partnerId" UUID NOT NULL,
    "businessId" UUID,
    "hostId" UUID,
    "consentType" "PartnerConsentType" NOT NULL,
    "isAccepted" BOOLEAN NOT NULL,
    "documentVersion" TEXT NOT NULL,
    "documentHash" TEXT NOT NULL,
    "documentKey" TEXT,
    "acceptedAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "partner_consents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "partner_agreements" (
    "id" UUID NOT NULL,
    "businessId" UUID NOT NULL,
    "signerId" UUID NOT NULL,
    "agreementNumber" TEXT NOT NULL,
    "agreementVersion" TEXT NOT NULL,
    "businessLegalName" TEXT NOT NULL,
    "signerName" TEXT NOT NULL,
    "signerDesignation" "RepresentativeDesignation" NOT NULL,
    "commissionPercentage" DECIMAL(5,2) NOT NULL,
    "commissionGst" DECIMAL(5,2) NOT NULL,
    "tdsPercentage" DECIMAL(5,2) NOT NULL,
    "payoutCycle" "PayoutCycle" NOT NULL,
    "payoutDelayDays" INTEGER NOT NULL,
    "terminationNoticeDays" INTEGER NOT NULL,
    "signatureMethod" "SignatureMethod",
    "esignProvider" TEXT,
    "esignTransactionId" TEXT,
    "esignReferenceId" TEXT,
    "unsignedDocumentKey" TEXT,
    "unsignedDocumentHash" TEXT,
    "signedDocumentKey" TEXT,
    "signedDocumentHash" TEXT,
    "status" "AgreementStatus" NOT NULL DEFAULT 'PENDING',
    "signedAt" TIMESTAMP(3),
    "effectiveFrom" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "terminatedAt" TIMESTAMP(3),
    "failureReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "partner_agreements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bank_details" (
    "id" UUID NOT NULL,
    "businessId" UUID NOT NULL,
    "accountHolderName" TEXT NOT NULL,
    "accountNumberEncrypted" TEXT NOT NULL,
    "accountNumberLastFour" VARCHAR(4) NOT NULL,
    "ifscCode" TEXT NOT NULL,
    "bankName" TEXT,
    "branchName" TEXT,
    "cancelledChequeKey" TEXT,
    "bankStatementKey" TEXT,
    "payoutCycle" "PayoutCycle" NOT NULL,
    "verificationStatus" "PartnerVerificationStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "isNameMatched" BOOLEAN,
    "providerReferenceId" TEXT,
    "pennyDropVerifiedAt" TIMESTAMP(3),
    "verifiedAt" TIMESTAMP(3),
    "failureReason" TEXT,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "payoutHoldUntil" TIMESTAMP(3),
    "deactivatedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bank_details_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "partner_reviews" (
    "id" UUID NOT NULL,
    "businessId" UUID NOT NULL,
    "businessApproval" "ApprovalStatus" NOT NULL DEFAULT 'PENDING',
    "identityApproval" "ApprovalStatus" NOT NULL DEFAULT 'PENDING',
    "backgroundApproval" "ApprovalStatus" NOT NULL DEFAULT 'PENDING',
    "vipApproval" "ApprovalStatus" NOT NULL DEFAULT 'NOT_REQUESTED',
    "interviewStatus" "InterviewStatus" NOT NULL DEFAULT 'NOT_REQUIRED',
    "interviewScheduledAt" TIMESTAMP(3),
    "interviewMeetingUrl" TEXT,
    "interviewCompletedAt" TIMESTAMP(3),
    "interviewRemarks" TEXT,
    "status" "ApprovalStatus" NOT NULL DEFAULT 'PENDING',
    "reviewedByAdminId" UUID,
    "remarks" TEXT,
    "rejectionReason" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "partner_reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event_hosts" (
    "id" UUID NOT NULL,
    "eventId" UUID NOT NULL,
    "hostId" UUID NOT NULL,
    "status" "EventHostStatus" NOT NULL DEFAULT 'ACTIVE',
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "removedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "event_hosts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_YourEventCategories" (
    "A" UUID NOT NULL,
    "B" UUID NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "event_partners_phoneNumber_key" ON "event_partners"("phoneNumber");

-- CreateIndex
CREATE UNIQUE INDEX "event_partners_email_key" ON "event_partners"("email");

-- CreateIndex
CREATE INDEX "business_details_partnerId_status_idx" ON "business_details"("partnerId", "status");

-- CreateIndex
CREATE INDEX "business_details_gstNumber_idx" ON "business_details"("gstNumber");

-- CreateIndex
CREATE INDEX "business_details_registrationNumber_idx" ON "business_details"("registrationNumber");

-- CreateIndex
CREATE INDEX "business_details_status_idx" ON "business_details"("status");

-- CreateIndex
CREATE UNIQUE INDEX "verify_ids_businessId_key" ON "verify_ids"("businessId");

-- CreateIndex
CREATE INDEX "verify_ids_status_expiresAt_idx" ON "verify_ids"("status", "expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "your_events_businessId_key" ON "your_events"("businessId");

-- CreateIndex
CREATE UNIQUE INDEX "partner_event_categories_value_key" ON "partner_event_categories"("value");

-- CreateIndex
CREATE INDEX "partner_event_categories_isActive_sortOrder_idx" ON "partner_event_categories"("isActive", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "hosts_invitationTokenHash_key" ON "hosts"("invitationTokenHash");

-- CreateIndex
CREATE INDEX "hosts_partnerId_idx" ON "hosts"("partnerId");

-- CreateIndex
CREATE INDEX "hosts_phoneNumber_status_idx" ON "hosts"("phoneNumber", "status");

-- CreateIndex
CREATE INDEX "hosts_businessId_status_idx" ON "hosts"("businessId", "status");

-- CreateIndex
CREATE INDEX "hosts_status_invitationExpiresAt_idx" ON "hosts"("status", "invitationExpiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "hosts_businessId_phoneNumber_key" ON "hosts"("businessId", "phoneNumber");

-- CreateIndex
CREATE UNIQUE INDEX "hosts_businessId_partnerId_key" ON "hosts"("businessId", "partnerId");

-- CreateIndex
CREATE UNIQUE INDEX "host_verify_ids_hostId_key" ON "host_verify_ids"("hostId");

-- CreateIndex
CREATE INDEX "host_verify_ids_status_expiresAt_idx" ON "host_verify_ids"("status", "expiresAt");

-- CreateIndex
CREATE INDEX "partner_consents_partnerId_consentType_idx" ON "partner_consents"("partnerId", "consentType");

-- CreateIndex
CREATE INDEX "partner_consents_businessId_consentType_idx" ON "partner_consents"("businessId", "consentType");

-- CreateIndex
CREATE INDEX "partner_consents_hostId_consentType_idx" ON "partner_consents"("hostId", "consentType");

-- CreateIndex
CREATE UNIQUE INDEX "partner_agreements_agreementNumber_key" ON "partner_agreements"("agreementNumber");

-- CreateIndex
CREATE INDEX "partner_agreements_businessId_status_idx" ON "partner_agreements"("businessId", "status");

-- CreateIndex
CREATE INDEX "partner_agreements_signerId_idx" ON "partner_agreements"("signerId");

-- CreateIndex
CREATE UNIQUE INDEX "partner_agreements_esignProvider_esignTransactionId_key" ON "partner_agreements"("esignProvider", "esignTransactionId");

-- CreateIndex
CREATE INDEX "bank_details_businessId_isActive_idx" ON "bank_details"("businessId", "isActive");

-- CreateIndex
CREATE INDEX "partner_reviews_businessId_status_idx" ON "partner_reviews"("businessId", "status");

-- CreateIndex
CREATE INDEX "partner_reviews_reviewedByAdminId_idx" ON "partner_reviews"("reviewedByAdminId");

-- CreateIndex
CREATE INDEX "partner_reviews_interviewStatus_interviewScheduledAt_idx" ON "partner_reviews"("interviewStatus", "interviewScheduledAt");

-- CreateIndex
CREATE INDEX "event_hosts_hostId_status_idx" ON "event_hosts"("hostId", "status");

-- CreateIndex
CREATE INDEX "event_hosts_eventId_status_idx" ON "event_hosts"("eventId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "event_hosts_eventId_hostId_key" ON "event_hosts"("eventId", "hostId");

-- CreateIndex
CREATE UNIQUE INDEX "_YourEventCategories_AB_unique" ON "_YourEventCategories"("A", "B");

-- CreateIndex
CREATE INDEX "_YourEventCategories_B_index" ON "_YourEventCategories"("B");

-- AddForeignKey
ALTER TABLE "business_details" ADD CONSTRAINT "business_details_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "event_partners"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "verify_ids" ADD CONSTRAINT "verify_ids_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "business_details"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "your_events" ADD CONSTRAINT "your_events_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "business_details"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hosts" ADD CONSTRAINT "hosts_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "business_details"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hosts" ADD CONSTRAINT "hosts_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "event_partners"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "host_verify_ids" ADD CONSTRAINT "host_verify_ids_hostId_fkey" FOREIGN KEY ("hostId") REFERENCES "hosts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "partner_consents" ADD CONSTRAINT "partner_consents_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "event_partners"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "partner_consents" ADD CONSTRAINT "partner_consents_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "business_details"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "partner_consents" ADD CONSTRAINT "partner_consents_hostId_fkey" FOREIGN KEY ("hostId") REFERENCES "hosts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "partner_agreements" ADD CONSTRAINT "partner_agreements_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "business_details"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "partner_agreements" ADD CONSTRAINT "partner_agreements_signerId_fkey" FOREIGN KEY ("signerId") REFERENCES "event_partners"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bank_details" ADD CONSTRAINT "bank_details_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "business_details"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "partner_reviews" ADD CONSTRAINT "partner_reviews_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "business_details"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_hosts" ADD CONSTRAINT "event_hosts_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_hosts" ADD CONSTRAINT "event_hosts_hostId_fkey" FOREIGN KEY ("hostId") REFERENCES "hosts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Event" ADD CONSTRAINT "Event_businessDetailsId_fkey" FOREIGN KEY ("businessDetailsId") REFERENCES "business_details"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_YourEventCategories" ADD CONSTRAINT "_YourEventCategories_A_fkey" FOREIGN KEY ("A") REFERENCES "partner_event_categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_YourEventCategories" ADD CONSTRAINT "_YourEventCategories_B_fkey" FOREIGN KEY ("B") REFERENCES "your_events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

BEGIN;

UPDATE "hosts"
SET "canViewGuestList" = TRUE,
    "canCheckInGuests" = TRUE,
    "canUpdateRunSheetProgress" = TRUE,
    "canViewRoomList" = TRUE,
    "canReportIncidentSOS" = TRUE
WHERE NOT "canViewGuestList"
   OR NOT "canCheckInGuests"
   OR NOT "canUpdateRunSheetProgress"
   OR NOT "canViewRoomList"
   OR NOT "canReportIncidentSOS";

ALTER TABLE "hosts"
ADD CONSTRAINT "hosts_required_permissions_check"
CHECK (
    "canViewGuestList"
    AND "canCheckInGuests"
    AND "canUpdateRunSheetProgress"
    AND "canViewRoomList"
    AND "canReportIncidentSOS"
);

COMMIT;

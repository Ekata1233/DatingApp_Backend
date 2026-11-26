ALTER TABLE "partner_government_id_attempts" ADD COLUMN "hostId" UUID;

CREATE INDEX "partner_government_id_attempts_hostId_idx"
ON "partner_government_id_attempts"("hostId");

ALTER TABLE "partner_government_id_attempts"
ADD CONSTRAINT "partner_government_id_attempts_hostId_fkey"
FOREIGN KEY ("hostId") REFERENCES "hosts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

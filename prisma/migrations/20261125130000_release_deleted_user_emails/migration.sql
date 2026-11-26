UPDATE "users"
SET "email" = NULL
WHERE "email" IS NOT NULL
  AND ("account_status" = 'DELETED' OR "deleted_at" IS NOT NULL);

import { MessagePermission } from "@prisma/client";

export interface UpdatePrivacySettingsInput {
  messagePermission?: MessagePermission;
  hideFromContacts?: boolean;
  ghostMode?: boolean;
}
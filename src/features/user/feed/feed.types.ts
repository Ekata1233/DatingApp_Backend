import { Prisma } from "@prisma/client";
import { Preferences } from "../../../utils/feedFilter.util";

export type FeedMode = "date_to_marry" | "dating" | "mature_connection";

export interface FeedParams {
  userId: string;
  cursor?: string;
  limit: number;
  mode: FeedMode;
  filters?: Preferences;
}

export type CurrentUser = Prisma.UserGetPayload<{
  include: {
    profile: true;
    eduWork: true;
    bio: true;
    photos: true;
    answer: {
      include: {
        question: true;
        option: true;
      };
    };
  };
}>;
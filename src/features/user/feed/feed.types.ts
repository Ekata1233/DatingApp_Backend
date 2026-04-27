import { Preferences } from "../../../utils/feedFilter.util";

export type FeedMode = "date_to_marry" | "dating" | "mature_connection";

export interface FeedParams {
  userId: string;
  cursor?: string;
  limit: number;
  mode: FeedMode;
  filters?: Preferences;
}

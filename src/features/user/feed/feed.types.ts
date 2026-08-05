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

// types/UserFeedTypes.ts
export interface UserFeedResponse {
  userId: string;
  fullName: string | null;
  age: number | null;
  gender: string | null;
  
  // Static values
  matchScore: number;
  trust: number;
  replyTime: string;
  
  // Basic Info
  bio: string | null;
  lookingFor: string | null;
  religion: string | null;
  motherTongue: string | null;
  height: number | null;
  city: string | null;
  state: string | null;
  country: string | null;
  zodiac: string | null;
  
  // Communication & Love Language
  communicationStyle: string | null;
  loveLanguage: string | null;
  
  // Photos
  photos: UserPhoto[];
  
  // Prompts
  prompts: UserPrompt[];
  
  // Career
  career: CareerInfo;
  
  // Lifestyle
  lifestyle: AnswerDetail[];
  
  // Interests
  interests: AnswerDetail[];
  
  // Family
  family: FamilyInfo;
}

export interface UserPhoto {
  id: string;
  url: string;
  isPrimary: boolean;
  order: number | null;
  mediaType: string;
}

export interface UserPrompt {
  id: string;
  question: string;
  answer: string;
  category: string | null;
  displayOrder: number;
}

export interface CareerInfo {
  highestEducation: string | null;
  degree: string | null;
  collegeName: string | null;
  graduationYear: number | null;
  profession: string | null;
  companyName: string | null;
  employmentType: string | null;
  experience: string | null;
  ambition: string | null;
  salaryRange: string | null;
  bigDreams: string | null;
}

export interface AnswerDetail {
  question: string;
  answer: string;
  description: string | null;
}

export interface FamilyInfo {
  familyStatus: string | null;
  familyType: string | null;
  fatherOccupation: string | null;
  fatherOrganisation: string | null;
  motherOccupation: string | null;
  motherOrganisation: string | null;
  familyHome: string | null;
  nativePlace: string | null;
  familyIncome: string | null;
  siblings: SiblingInfo[];
}

export interface SiblingInfo {
  relation: string | null;
  occupation: string | null;
  marital: string | null;
}
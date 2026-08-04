// src/modules/profile/profile.types.ts

import {
    CommunicationStyle,
    EducationLevel,
    Gender,
    GenderOption,
    LookingFor,
    LookingForOption,
    LoveLanguage,
    Zodiac,
} from "@prisma/client";

/* -------------------------------------------------------------------------- */
/*                              Common Interfaces                             */
/* -------------------------------------------------------------------------- */

export interface IdName {
    id: string | number;
    name: string;
}

export interface IdValue {
    id: number | string;
    value: string;
}

export interface IdTitle {
    id: string | number;
    title: string;
}

export interface PhotoResponse {
    id: string;
    url: string;
    order: number | null;
    isPrimary: boolean;
}

export interface VideoResponse {
    id: string;
    url: string;
}

/* -------------------------------------------------------------------------- */
/*                              Basic Details                                 */
/* -------------------------------------------------------------------------- */

export interface BasicDetailsResponse {
    fullName: string | null;
    email: string | null;
    phoneNumber: string | null;
    birthDate: string | null;
    height: number | null;

    gender: Gender | null;
    genderOption: GenderOption | null;

    religion: IdName | null;
    community: IdName | null;
    languages: IdName[];
    zodiac: Zodiac | null;
    loveLanguage: LoveLanguage | null;
    communicationStyle: CommunicationStyle | null;
}

/* -------------------------------------------------------------------------- */
/*                                   Bio                                      */
/* -------------------------------------------------------------------------- */

export interface BioResponse {
    bio: string | null;
}

/* -------------------------------------------------------------------------- */
/*                              Intention                                     */
/* -------------------------------------------------------------------------- */

export interface LookingForResponse {
    id: string | null;
    title: string | null;
    description: string | null;
}

/* -------------------------------------------------------------------------- */
/*                            User Profile                                    */
/* -------------------------------------------------------------------------- */

export interface ProfileResponse {
    interestedIn: Gender | null;
    sexualOrientation: GenderOption | null;
}

/* -------------------------------------------------------------------------- */
/*                          Education & Career                                */
/* -------------------------------------------------------------------------- */

export interface EducationCareerResponse {
    highestEducation: EducationLevel | null;

    degree: string | null;

    collegeName: string | null;

    graduationYear: number | null;

    profession: IdName | null;

    companyName: string | null;

    employmentType: IdName | null;

    experience: IdTitle | null;

    ambition: IdTitle | null;

    salaryRange: IdTitle | null;

    bigDreams: string | null;
}

/* -------------------------------------------------------------------------- */
/*                               Family                                       */
/* -------------------------------------------------------------------------- */

export interface SiblingResponse {
    id: string;

    relation: IdName | null;

    occupation: IdName | null;

    maritalStatus: IdName | null;
}

export interface FamilyResponse {
    familyStatus: IdValue | null;

    familyType: IdValue | null;

    fatherOccupation: IdValue | null;

    fatherOrganisation: IdValue | null;

    motherOccupation: IdValue | null;

    motherOrganisation: IdValue | null;

    familyHome: IdValue | null;

    nativePlace: IdValue | null;

    familyIncome: IdTitle | null;

    siblings: SiblingResponse[];
}

/* -------------------------------------------------------------------------- */
/*                               Interests                                    */
/* -------------------------------------------------------------------------- */

export interface InterestResponse {
    id: string;
    question: string;
    option: string;
}

/* -------------------------------------------------------------------------- */
/*                                Prompt                                      */
/* -------------------------------------------------------------------------- */

export interface PromptResponse {
    id: string;

    promptId: string;

    question: string;

    answer: string;

    displayOrder: number;
}

/* -------------------------------------------------------------------------- */
/*                           Edit Profile Response                            */
/* -------------------------------------------------------------------------- */

export interface EditProfileResponse {
    basicDetails: BasicDetailsResponse;

    photos: PhotoResponse[];

    video: VideoResponse | null;

    bio: BioResponse;

    lookingFor: LookingForResponse;

    profile: ProfileResponse;

    educationCareer: EducationCareerResponse | null;

    family: FamilyResponse | null;

    interests: InterestResponse[];

    prompts: PromptResponse[];
}
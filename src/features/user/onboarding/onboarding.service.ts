// // user.service.ts

// import { prisma } from "../../../prisma/prismaClient";


// export const getUserDetailsService = async (
//   userId: string,
//   type?: string,
// ) => {
//     if (!userId) {
//         throw new Error("User ID is required");
//     }

//     const user = await prisma.user.findUnique({
//         where: {
//             id: userId,
//         },

//         include: {
//             // Interested in / intention
//             intention: true,

//             // Profile
//             profile: {
//                 include: {
//                     religion: true,
//                     community: true,

//                     languages: {
//                         include: {
//                             language: true,
//                         },
//                     },
//                 },
//             },

//             // Lifestyle / Interest answers
//             answer: {
//                 include: {
//                     question: true,
//                     option: true,
//                 },
//                 orderBy: {
//                     created_at: "asc",
//                 },
//             },

//             // Career & ambition
//             eduWork: {
//                 include: {
//                     profession: true,
//                     employmentType: true,
//                     experience: true,
//                     ambition: true,
//                     salaryRange: true,
//                 },
//             },

//             // Photos
//             photos: {
//                 orderBy: [
//                     {
//                         is_primary: "desc",
//                     },
//                     {
//                         order: "asc",
//                     },
//                     {
//                         created_at: "asc",
//                     },
//                 ],
//             },

//             // Story
//             bio: true,

//             // Prompts
//             userPrompts: {
//                 include: {
//                     prompt: {
//                         include: {
//                             category: true,
//                         },
//                     },
//                 },
//                 orderBy: {
//                     displayOrder: "asc",
//                 },
//             },
//         },

//         // Do not expose sensitive/internal fields unnecessarily
//         // You can replace include with select later if needed.
//     });

//     if (!user) {
//         throw new Error("User not found");
//     }

//     /**
//      * Separate dynamic answers according to QuestionCategory.
//      *
//      * IMPORTANT:
//      * Replace these enum values if your actual QuestionCategory
//      * enum has different names.
//      */
//     const lifestyleAnswers = user.answer.filter(
//         (answer) => answer.question.screen === "LIFESTYLE",
//     );

//     /**
//      * INTEREST
//      */
//     const interestAnswers = user.answer.filter(
//         (answer) => answer.question.screen === "THINGS_U_LOVE",
//     );

//     return {
//         userId: user.id,

//         flows: {
//             VERIFY_PHONE: {
//                 phoneNumber: user.phone_number,
//                 isPhoneVerified: user.is_phone_verified,
//             },

//             BASIC_INFO: {
//                 fullName: user.full_name,
//                 email: user.email,
//                 dateOfBirth: user.birth_date,
//                 height: user.height,
//                 gender: user.gender,
//                 genderOption: user.gender_option,
//             },

//             INTERESTED_IN: {
//                 interestedIn: user.profile?.interested_in ?? null,
//             },

//             LOOKING_FOR: {
//                 intention: user.intention,
//             },

//             LIFESTYLE: lifestyleAnswers.map((answer) => ({
//                 answerId: answer.id,

//                 question: {
//                     id: answer.question.id,
//                     key: answer.question.key,
//                     title: answer.question.title,
//                     category: answer.question.category,
//                     screen: answer.question.screen,
//                     isMulti: answer.question.isMulti,
//                 },

//                 option: {
//                     id: answer.option.id,
//                     value: answer.option.value,
//                     label: answer.option.label,
//                 },

//                 description: answer.description,
//                 createdAt: answer.created_at,
//             })),

//             CAREER_AMBITION: user.eduWork
//                 ? {
//                     highestEducation: user.eduWork.highestEdu,

//                     degree: user.eduWork.degree,

//                     collegeName: user.eduWork.collegeName,

//                     graduationYear: user.eduWork.graduationYear,

//                     profession: user.eduWork.profession
//                         ? {
//                             id: user.eduWork.profession.id,
//                             name: user.eduWork.profession.name,
//                             isActive: user.eduWork.profession.isActive,
//                         }
//                         : null,

//                     companyName: user.eduWork.companyName,

//                     employmentType: user.eduWork.employmentType
//                         ? {
//                             id: user.eduWork.employmentType.id,
//                             name: user.eduWork.employmentType.name,
//                             isActive: user.eduWork.employmentType.isActive,
//                         }
//                         : null,

//                     experience: user.eduWork.experience
//                         ? {
//                             id: user.eduWork.experience.id,
//                             title: user.eduWork.experience.title,
//                             sortOrder: user.eduWork.experience.sortOrder,
//                             isActive: user.eduWork.experience.isActive,
//                         }
//                         : null,

//                     ambition: user.eduWork.ambition
//                         ? {
//                             id: user.eduWork.ambition.id,
//                             title: user.eduWork.ambition.title,
//                             isActive: user.eduWork.ambition.isActive,
//                         }
//                         : null,

//                     salaryRange: user.eduWork.salaryRange
//                         ? {
//                             id: user.eduWork.salaryRange.id,
//                             title: user.eduWork.salaryRange.title,
//                             minSalary: user.eduWork.salaryRange.minSalary,
//                             maxSalary: user.eduWork.salaryRange.maxSalary,
//                             isActive: user.eduWork.salaryRange.isActive,
//                         }
//                         : null,

//                     bigDreams: user.eduWork.bigDreams,
//                 }
//                 : null,

//             INTEREST: interestAnswers.map((answer) => ({
//                 answerId: answer.id,

//                 question: {
//                     id: answer.question.id,
//                     key: answer.question.key,
//                     title: answer.question.title,
//                     category: answer.question.category,
//                     screen: answer.question.screen,
//                     isMulti: answer.question.isMulti,
//                 },

//                 option: {
//                     id: answer.option.id,
//                     value: answer.option.value,
//                     label: answer.option.label,
//                 },

//                 description: answer.description,
//                 createdAt: answer.created_at,
//             })),

//             PHOTOS: user.photos.map((photo) => ({
//                 id: photo.id,
//                 mediaUrl: photo.media_url,
//                 mediaType: photo.media_type,
//                 isPrimary: photo.is_primary,
//                 order: photo.order,
//             })),

//             STORY: {
//                 bio: user.bio?.bio ?? null,
//             },

//             PROMPT: user.userPrompts.map((userPrompt) => ({
//                 id: userPrompt.id,
//                 promptId: userPrompt.promptId,
//                 question: userPrompt.prompt.question,
//                 answer: userPrompt.answer,
//                 displayOrder: userPrompt.displayOrder,

//                 category: userPrompt.prompt.category
//                     ? {
//                         id: userPrompt.prompt.category.id,
//                         name: userPrompt.prompt.category.name,
//                     }
//                     : null,
//             })),

//             LOCATION: {
//                 country: user.profile?.country ?? null,
//                 state: user.profile?.state ?? null,
//                 city: user.profile?.city ?? null,
//                 area: user.profile?.area ?? null,
//                 latitude: user.profile?.latitude
//                     ? Number(user.profile.latitude)
//                     : null,
//                 longitude: user.profile?.longitude
//                     ? Number(user.profile.longitude)
//                     : null,
//                 maxDistanceKm: user.profile?.max_distance_km ?? null,
//             },

//             REVIEW_FINISH: {
//                 profileCompletion: user.profile_completion,
//                 onboardingStep: user.onboarding_step,
//                 nextStep: user.next_step,
//                 onboardingCompleted: user.onboarding_completed,
//             },
//         },
//     };
// };

import { prisma } from "../../../prisma/prismaClient";
import { isValidWelvorsFlow, WelvorsFlow } from "./onboarding.controller";

export const getUserDetailsService = async (
    userId: string,
    type?: string,
) => {
    if (!userId) {
        throw new Error("User ID is required");
    }

    // Validate type if provided
    if (type && !isValidWelvorsFlow(type)) {
        throw new Error("Invalid onboarding type");
    }

    const user = await prisma.user.findUnique({
        where: {
            id: userId,
        },

        include: {
            // Interested in / intention
            intention: true,

            // Profile
            profile: {
                include: {
                    religion: true,
                    community: true,

                    languages: {
                        include: {
                            language: true,
                        },
                    },
                },
            },

            // Lifestyle / Interest answers
            answer: {
                include: {
                    question: true,
                    option: true,
                },

                orderBy: {
                    created_at: "asc",
                },
            },

            // Career & ambition
            eduWork: {
                include: {
                    profession: true,
                    employmentType: true,
                    experience: true,
                    ambition: true,
                    salaryRange: true,
                },
            },

            // Photos
            photos: {
                orderBy: [
                    {
                        is_primary: "desc",
                    },
                    {
                        order: "asc",
                    },
                    {
                        created_at: "asc",
                    },
                ],
            },

            // Story
            bio: true,

            // Prompts
            userPrompts: {
                include: {
                    prompt: {
                        include: {
                            category: true,
                        },
                    },
                },

                orderBy: {
                    displayOrder: "asc",
                },
            },
        },
    });

    if (!user) {
        throw new Error("User not found");
    }

    /**
     * LIFESTYLE ANSWERS
     */
    const lifestyleAnswers = user.answer.filter(
        (answer) => answer.question.screen === "LIFESTYLE",
    );

    /**
     * INTEREST ANSWERS
     */
    const interestAnswers = user.answer.filter(
        (answer) => answer.question.screen === "THINGS_U_LOVE",
    );

    /**
     * ALL ONBOARDING FLOWS
     */
    const flows = {
        VERIFY_PHONE: {
            phoneNumber: user.phone_number,
            isPhoneVerified: user.is_phone_verified,
        },

        BASIC_INFO: {
            fullName: user.full_name,
            email: user.email,
            dateOfBirth: user.birth_date,
            height: user.height,
            gender: user.gender,
            genderOption: user.gender_option,
        },

        INTERESTED_IN: {
            interestedIn: user.profile?.interested_in ?? null,
        },

        LOOKING_FOR: {
            intention: user.intention,
        },

        LIFESTYLE: lifestyleAnswers.map((answer) => ({
            answerId: answer.id,

            question: {
                id: answer.question.id,
                key: answer.question.key,
                title: answer.question.title,
                category: answer.question.category,
                screen: answer.question.screen,
                isMulti: answer.question.isMulti,
            },

            option: {
                id: answer.option.id,
                value: answer.option.value,
                label: answer.option.label,
            },

            description: answer.description,
            createdAt: answer.created_at,
        })),

        CAREER_AMBITION: user.eduWork
            ? {
                highestEducation: user.eduWork.highestEdu,

                degree: user.eduWork.degree,

                collegeName: user.eduWork.collegeName,

                graduationYear: user.eduWork.graduationYear,

                profession: user.eduWork.profession
                    ? {
                        id: user.eduWork.profession.id,
                        name: user.eduWork.profession.name,
                        isActive: user.eduWork.profession.isActive,
                    }
                    : null,

                companyName: user.eduWork.companyName,

                employmentType: user.eduWork.employmentType
                    ? {
                        id: user.eduWork.employmentType.id,
                        name: user.eduWork.employmentType.name,
                        isActive: user.eduWork.employmentType.isActive,
                    }
                    : null,

                experience: user.eduWork.experience
                    ? {
                        id: user.eduWork.experience.id,
                        title: user.eduWork.experience.title,
                        sortOrder: user.eduWork.experience.sortOrder,
                        isActive: user.eduWork.experience.isActive,
                    }
                    : null,

                ambition: user.eduWork.ambition
                    ? {
                        id: user.eduWork.ambition.id,
                        title: user.eduWork.ambition.title,
                        isActive: user.eduWork.ambition.isActive,
                    }
                    : null,

                salaryRange: user.eduWork.salaryRange
                    ? {
                        id: user.eduWork.salaryRange.id,
                        title: user.eduWork.salaryRange.title,
                        minSalary: user.eduWork.salaryRange.minSalary,
                        maxSalary: user.eduWork.salaryRange.maxSalary,
                        isActive: user.eduWork.salaryRange.isActive,
                    }
                    : null,

                bigDreams: user.eduWork.bigDreams,
            }
            : null,

        INTEREST: interestAnswers.map((answer) => ({
            answerId: answer.id,

            question: {
                id: answer.question.id,
                key: answer.question.key,
                title: answer.question.title,
                category: answer.question.category,
                screen: answer.question.screen,
                isMulti: answer.question.isMulti,
            },

            option: {
                id: answer.option.id,
                value: answer.option.value,
                label: answer.option.label,
            },

            description: answer.description,
            createdAt: answer.created_at,
        })),

        PHOTOS: user.photos.map((photo) => ({
            id: photo.id,
            mediaUrl: photo.media_url,
            mediaType: photo.media_type,
            isPrimary: photo.is_primary,
            order: photo.order,
        })),

        STORY: {
            bio: user.bio?.bio ?? null,
        },

        PROMPT: user.userPrompts.map((userPrompt) => ({
            id: userPrompt.id,
            promptId: userPrompt.promptId,
            question: userPrompt.prompt.question,
            answer: userPrompt.answer,
            displayOrder: userPrompt.displayOrder,

            category: userPrompt.prompt.category
                ? {
                    id: userPrompt.prompt.category.id,
                    name: userPrompt.prompt.category.name,
                }
                : null,
        })),

        LOCATION: {
            country: user.profile?.country ?? null,
            state: user.profile?.state ?? null,
            city: user.profile?.city ?? null,
            area: user.profile?.area ?? null,

            latitude: user.profile?.latitude
                ? Number(user.profile.latitude)
                : null,

            longitude: user.profile?.longitude
                ? Number(user.profile.longitude)
                : null,

            maxDistanceKm:
                user.profile?.max_distance_km ?? null,
        },

        REVIEW_FINISH: {
            profileCompletion: user.profile_completion,
            onboardingStep: user.onboarding_step,
            nextStep: user.next_step,
            onboardingCompleted: user.onboarding_completed,
        },
    };

    /**
     * IF TYPE IS PROVIDED
     *
     * Example:
     * ?type=PHOTOS
     */
    if (type) {
        if (type === "REVIEW_FINISH") {
            return {
                userId: user.id,
                type: "REVIEW_FINISH",

                data: {
                    ...flows,

                    REVIEW_FINISH: {
                        profileCompletion: user.profile_completion,
                        onboardingStep: user.onboarding_step,
                        nextStep: user.next_step,
                        onboardingCompleted: user.onboarding_completed,
                    },
                },
            };
        }

        return {
            userId: user.id,
            type: type as WelvorsFlow,
            data: flows[type as WelvorsFlow],
        };
    }

    /**
     * IF TYPE IS NOT PROVIDED
     *
     * Return all flows
     */
    return {
        userId: user.id,
        flows,
    };
};
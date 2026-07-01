import { ageScore, bioScore, buildAnswerMap, communicationScore, degreeScore, dietScore, drinkScore, educationScore, genderPreferenceScore, graduationYearScore, heightScore, interestScore, languageScore, loveLanguageScore, occupationScore, orientationScore, petScore, photoScore, profileCompletenessScore, smokeScore, workoutScore, zodiacScore } from "./matchScore";

export function calculateMatchScore(me: any, user: any) {

    let score = 0;

    score += educationScore(
        me.eduWork?.highestEdu,
        user.eduWork?.highestEdu
    );

    score += degreeScore(
        me.eduWork?.degree,
        user.eduWork?.degree
    );

    score += graduationYearScore(
        me.eduWork?.graduationYear,
        user.eduWork?.graduationYear
    );

    // Gender Preference
    score += genderPreferenceScore(
        me.gender,
        me.profile?.interested_in,
        user.gender,
        user.profile?.interested_in
    );

    score += orientationScore(
        me.profile?.sexual_orientation,
        user.profile?.sexual_orientation
    );

    // Age
    score += ageScore(
        me.birth_date,
        user.birth_date
    );

    // Height
    score += heightScore(
        me.height,
        user.height
    );

    score += occupationScore(
        me.profile.occupation,
        user.profile.occupation
    );

    // score += drinkScore(
    //     me.profile.drinking,
    //     user.profile.drinking
    // );
    
    const myAnswers = buildAnswerMap(me.answer);
    const otherAnswers = buildAnswerMap(user.answer);

    score += drinkScore(
        myAnswers["drinking"],
        otherAnswers["drinking"]
    );

    score += smokeScore(
        me.profile.smoking,
        user.profile.smoking
    );

    score += workoutScore(
        me.profile.workout,
        user.profile.workout
    );

    score += dietScore(
        me.profile.diet,
        user.profile.diet
    );

    score += petScore(
        me.profile.pet,
        user.profile.pet
    );

    score += communicationScore(
        me.profile.communication_style,
        user.profile.communication_style
    );

    score += loveLanguageScore(
        me.profile.love_language,
        user.profile.love_language
    );

    score += interestScore(
        me.profile.interests,
        user.profile.interests
    );

    score += languageScore(
        me.profile.languages,
        user.profile.languages
    );

    // Zodiac
    score += zodiacScore(
        me.profile.star_sign,
        user.profile.star_sign
    );

    // Bio
    score += bioScore(
        me.profile.bio,
        user.profile.bio
    );

    // Photos
    score += photoScore(
        me.photos?.length ?? 0,
        user.photos?.length ?? 0
    );

    // Optional profile completeness
    score += profileCompletenessScore(me);
    score += profileCompletenessScore(user);

    return Math.round(score);
}
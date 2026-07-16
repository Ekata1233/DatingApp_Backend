import { ageScore, ambitionScore, bioScore, buildAnswerMap, communicationScore, communityScore, degreeScore, dietScore, distanceScore, drinkScore, educationScore, employmentTypeScore, experienceScore, familyProfileScore, genderPreferenceScore, getAnswerValues, graduationYearScore, heightScore, languageScore, loveLanguageScore, multiSelectScore, occupationScore, orientationScore, petScore, photoScore, profileCompletenessScore, religionScore, salaryScore, smokeScore, workoutScore, zodiacScore } from "./matchScore";

export function calculateMatchScore(me: any, user: any) {

    let score = 0;

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

    // score += drinkScore(
    //     me.profile.drinking,
    //     user.profile.drinking
    // );

    score += educationScore(
        me.eduWork?.highestEdu,
        user.eduWork?.highestEdu
    );

    score += degreeScore(
        me.eduWork?.degree,
        user.eduWork?.degree
    );

    score += employmentTypeScore(
        me.eduWork?.employmentTypeId,
        user.eduWork?.employmentTypeId
    );

    score += experienceScore(
        me.eduWork?.experienceId,
        user.eduWork?.experienceId
    );

    score += ambitionScore(
        me.eduWork?.ambitionId,
        user.eduWork?.ambitionId
    );

    score += salaryScore(
        me.eduWork?.salaryRangeId,
        user.eduWork?.salaryRangeId
    );

    score += religionScore(
        me.profile?.religionId,
        user.profile?.religionId
    );

    score += communityScore(
        me.profile?.communityId,
        user.profile?.communityId
    );

    score += familyProfileScore(
        me.familyProfile,
        user.familyProfile
    );

    // score += distanceScore(distanceKm);

    const myAnswers = buildAnswerMap(me.answer);
    const otherAnswers = buildAnswerMap(user.answer);

    console.log("myAnswers", myAnswers);
    console.log("otherAnswers", otherAnswers);

    score += drinkScore(
        myAnswers["drinking"],
        otherAnswers["drinking"]
    );

    score += smokeScore(
        myAnswers["smoking"],
        otherAnswers["smoking"]
    );

    score += workoutScore(
        myAnswers["workout"],
        otherAnswers["workout"]
    );

    score += petScore(
        myAnswers["pets"],
        otherAnswers["pets"]
    );

    score += dietScore(
        myAnswers["diet"],
        otherAnswers["diet"]
    );

    score += communicationScore(
        myAnswers["communication_style"],
        otherAnswers["communication_style"]
    );

    score += loveLanguageScore(
        myAnswers["love_language"],
        otherAnswers["love_language"]
    );

    score += occupationScore(
        myAnswers["occupation"],
        otherAnswers["occupation"]
    );

    // Zodiac
    score += zodiacScore(
        myAnswers["star_sign"],
        otherAnswers["star_sign"]
    );

    score += multiSelectScore(
        getAnswerValues(me.answer, "creativity"),
        getAnswerValues(user.answer, "creativity")
    );

    score += multiSelectScore(
        getAnswerValues(me.answer, "fan_favorites"),
        getAnswerValues(user.answer, "fan_favorites")
    );

    score += multiSelectScore(
        getAnswerValues(me.answer, "food_and_drinks"),
        getAnswerValues(user.answer, "food_and_drinks")
    );


    score += multiSelectScore(
        getAnswerValues(me.answer, "gaming"),
        getAnswerValues(user.answer, "gaming")
    );

    score += multiSelectScore(
        getAnswerValues(me.answer, "going_out"),
        getAnswerValues(user.answer, "going_out")
    );

    score += multiSelectScore(
        getAnswerValues(me.answer, "music"),
        getAnswerValues(user.answer, "music")
    );

    score += multiSelectScore(
        getAnswerValues(me.answer, "outdoors_and_adventure"),
        getAnswerValues(user.answer, "outdoors_and_adventure")
    );

    score += multiSelectScore(
        getAnswerValues(me.answer, "social_and_content"),
        getAnswerValues(user.answer, "social_and_content")
    );

    score += multiSelectScore(
        getAnswerValues(me.answer, "sports_and_fitness"),
        getAnswerValues(user.answer, "sports_and_fitness")
    );

    score += multiSelectScore(
        getAnswerValues(me.answer, "staying_in"),
        getAnswerValues(user.answer, "staying_in")
    );

    score += multiSelectScore(
        getAnswerValues(me.answer, "tv_and_movies"),
        getAnswerValues(user.answer, "tv_and_movies")
    );

    score += multiSelectScore(
        getAnswerValues(me.answer, "values_and_causes"),
        getAnswerValues(user.answer, "values_and_causes")
    );

    score += multiSelectScore(
        getAnswerValues(me.answer, "wellness_and_lifestyle"),
        getAnswerValues(user.answer, "wellness_and_lifestyle")
    );

    score += languageScore(
        me.profile?.languages?.map((l: any) => l.language?.name) ?? [],
        user.profile?.languages?.map((l: any) => l.language?.name) ?? []
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
    score += Math.min(
        profileCompletenessScore(me),
        profileCompletenessScore(user)
    );

    const MAX_SCORE = 150;

    return {
        score,
        percentage: Math.round((score / MAX_SCORE) * 100),
    };
}
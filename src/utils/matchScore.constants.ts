import { ageScore, bioScore, buildAnswerMap, communicationScore, creativityScore, degreeScore, dietScore, drinkScore, educationScore, genderPreferenceScore, getAnswerValues, graduationYearScore, heightScore, languageScore, loveLanguageScore, multiSelectScore, occupationScore, orientationScore, petScore, photoScore, profileCompletenessScore, smokeScore, workoutScore, zodiacScore } from "./matchScore";

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

    // score += drinkScore(
    //     me.profile.drinking,
    //     user.profile.drinking
    // );

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
        me.profile.languages,
        user.profile.languages
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
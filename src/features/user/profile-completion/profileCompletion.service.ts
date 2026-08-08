// import { PROFILE_WEIGHTS } from "../../../config/profileCompletion";

// export const calculateProfileCompletion = (user: any) => {
//   let score = 0;

//   if (user.full_name) score += PROFILE_WEIGHTS.full_name;
//   if (user.profile_image) score += PROFILE_WEIGHTS.profile_image;
//   if (user.bio) score += PROFILE_WEIGHTS.bio;
//   if (user.gender) score += PROFILE_WEIGHTS.gender;
//   if (user.birth_date) score += PROFILE_WEIGHTS.birth_date;
//   if (user.location) score += PROFILE_WEIGHTS.location;

//   if (user.interests?.length > 0)
//     score += PROFILE_WEIGHTS.interests;

//   if (user.photos?.length > 0)
//     score += PROFILE_WEIGHTS.photos;

//   if (user.voice_intro)
//     score += PROFILE_WEIGHTS.voice_intro;

//   return score;
// };
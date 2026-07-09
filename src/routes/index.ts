
import { Router } from "express";
import interestRoutes from "../features/admin/onboarding/interestedIn/interestedIn.routes";
import sexualOrientationRoutes from "../features/admin/onboarding/sexualorientations/sexualorientations.routes";
import lifestyleRoutes from "../features/admin/onboarding/lifestyle/lifestyle.routes";
import realYouMattersRoutes from "../features/admin/onboarding/realYouMatters/realYouMatters.routes";
import lookingForRoutes from "../features/admin/onboarding/lookingFor/lookingFor.route";
import thingsYouLoveRoutes from "../features/admin/onboarding/thingsYouLove/thingsYouLove.routes";
import mobileAuthRoutes from "../features/user/mobile-auth/auth.routes";
import googleAuthRoutes from "../features/user/google-auth/google-auth.routes";
import userManageRoutes from "../features/user/management/user.route";
import profileRoutes from "../features/user/profile/profile.routes";
import messageRoutes from "../features/user/messages/message.route";
import religionRoutes from "../features/admin/onboarding/religion/religion.route";
import educationRoutes from "../features/admin/onboarding/education/education.routes";
import workDetailsRoutes from "../features/admin/onboarding/workDetails/workDetails.routes";
import interestHobbiesRoutes from "../features/admin/onboarding/interestHobbies/interestHobbies.routes";
import dreamsFutureRoutes from "../features/admin/onboarding/dreamsFuture/dreamsFuture.routes";
import packageRoutes from "../features/admin/package/package.routes";
import questionRoutes from "../features/admin/onboarding/questionAnswer/question.route";
import blockRoutes from "../features/user/block/block.routes";
import reportRoutes from "../features/user/report/report.routes";
import feedRoutes from "../features/user/feed/feed.routes";
import detailsRoutes from "../features/user/details/details.routes";
import lastActivityRoutes from "../features/lastActivity/lastActivity.routes";
import boostRoutes from "../features/admin/boost/boost.routes";
import swipeRoutes from "../features/swipe/swipe.routes";
import dateNowAdminRoutes from "../features/admin/dateNow/dateNow.routes";
import dateNowRoutes from "../features/dateNow/dateNow.routes";
import intentionRoutes from "../features/admin/onboarding/intention/intention.routes";
import professionRoutes from "../features/admin/onboarding/profession/profession.route";
import employmentTypeRoutes from "../features/admin/onboarding/employmentType/employmentType.route";
import ExperienceRoutes from "../features/admin/onboarding/experience/experience.routes";
import ambitionRoutes from "../features/admin/onboarding/ambition/ambition.routes";
import salaryRangeRoutes from "../features/admin/onboarding/salaryRange/salaryRange.routes";
import promptRoutes from "../features/admin/onboarding/prompt/prompt.routes";
import familyProfileRoutes from "../features/admin/onboarding/familyProfile/familyProfile.routes";
import languageRoutes from "../features/admin/onboarding/language/language.routes";
import waitlistRoutes from "../features/admin/waitlist/waitlist.routes";
import referralRoutes from "../features/user/referral/referral.routes"

const router = Router();

router.use("/interested-in", interestRoutes);
router.use("/sexual-orientation",sexualOrientationRoutes)
router.use("/lifestyle",lifestyleRoutes)
router.use("/lookingFor",lookingForRoutes)
router.use("/realYouMatters",realYouMattersRoutes)
router.use("/thingsYouLove",thingsYouLoveRoutes)
router.use("/religion", religionRoutes);
router.use("/education", educationRoutes);
router.use("/workDetails", workDetailsRoutes);
router.use("/interestHobbies", interestHobbiesRoutes);
router.use("/dreamsFuture", dreamsFutureRoutes);
router.use("/question", questionRoutes);
router.use("/boost",boostRoutes)
router.use("/package",packageRoutes)
router.use("/intention",intentionRoutes)
router.use("/admin",professionRoutes,employmentTypeRoutes,ExperienceRoutes,ambitionRoutes,salaryRangeRoutes,promptRoutes,familyProfileRoutes,languageRoutes,waitlistRoutes);



router.use("/onboarding",professionRoutes,employmentTypeRoutes,ExperienceRoutes,intentionRoutes,interestRoutes,ambitionRoutes,salaryRangeRoutes,languageRoutes,promptRoutes);
router.use("/user",waitlistRoutes)


// router.use("/users",usersRoutes)
router.use("/user",mobileAuthRoutes,googleAuthRoutes,userManageRoutes,profileRoutes,messageRoutes,referralRoutes)
router.use("/user",blockRoutes)
router.use("/user",reportRoutes)
router.use("/user",feedRoutes)
router.use("/user",detailsRoutes)

//boost upgrade and active route
router.use("/user",boostRoutes)
//

//last seen & online status 
router.use("/user",lastActivityRoutes)
//end of presence handling

//swipe routes
router.use("/user", swipeRoutes);
//

router.use("/user", dateNowRoutes);

router.use(
  "/admin/date-now",
  dateNowAdminRoutes
);
export default router;

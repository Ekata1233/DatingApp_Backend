
import { Router } from "express";
import interestRoutes from "../features/onboarding/interestedIn/interestedIn.routes";
import sexualOrientationRoutes from "../features/onboarding/sexualorientations/sexualorientations.routes";
import lifestyleRoutes from "../features/onboarding/lifestyle/lifestyle.routes";
import realYouMattersRoutes from "../features/onboarding/realYouMatters/realYouMatters.routes";
import lookingForRoutes from "../features/onboarding/lookingFor/lookingFor.route";
import thingsYouLoveRoutes from "../features/onboarding/thingsYouLove/thingsYouLove.routes";
import mobileAuthRoutes from "../features/user/mobile-auth/auth.routes";
import googleAuthRoutes from "../features/user/google-auth/google-auth.routes";
import userManageRoutes from "../features/user/management/user.route";
import profileRoutes from "../features/user/profile/profile.routes";
import messageRoutes from "../features/user/messages/message.route";
import religionRoutes from "../features/onboarding/religion/religion.route";
import educationRoutes from "../features/onboarding/education/education.routes";
import workDetailsRoutes from "../features/onboarding/workDetails/workDetails.routes";
import interestHobbiesRoutes from "../features/onboarding/interestHobbies/interestHobbies.routes";
import dreamsFutureRoutes from "../features/onboarding/dreamsFuture/dreamsFuture.routes";
import packageRoutes from "../features/admin/package/package.routes";
import questionRoutes from "../features/onboarding/questionAnswer/question.route";
import blockRoutes from "../features/user/block/block.routes";
import reportRoutes from "../features/user/report/report.routes";
import feedRoutes from "../features/user/feed/feed.routes";
import detailsRoutes from "../features/user/details/details.routes";
import lastActivityRoutes from "../features/lastActivity/lastActivity.routes";
import boostRoutes from "../features/admin/boost/boost.routes";
import swipeRoutes from "../features/swipe/swipe.routes";
import dateNowRoutes from "../features/dateNow/dateNow.routes";

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

// router.use("/users",usersRoutes)
router.use("/user",mobileAuthRoutes,googleAuthRoutes,userManageRoutes,profileRoutes,messageRoutes)
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
//end

//date now routes
router.use("/user", dateNowRoutes);
//end

export default router;


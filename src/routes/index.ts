import { Router } from "express";
import interestRoutes from "../features/onboarding/interestedIn/interestedIn.routes";
import sexualOrientationRoutes from "../features/onboarding/sexualorientations/sexualorientations.routes";
import lifestyleRoutes from "../features/onboarding/lifestyle/lifestyle.routes";
import realYouMattersRoutes from "../features/onboarding/realYouMatters/realYouMatters.routes";
import thingsYouLoveRoutes from "../features/onboarding/thingsYouLove/thingsYouLove.routes";
import genderRoutes from "../features/onboarding/gender/gender.routes";
import mobileAuthRoutes from "../features/user/mobile-auth/auth.routes";
import googleAuthRoutes from "../features/user/google-auth/google-auth.routes";
import userManageRoutes from "../features/user/management/user.route";

const router = Router();

router.use("/interested-in", interestRoutes);
router.use("/sexual-orientation",sexualOrientationRoutes)
router.use("/lifestyle",lifestyleRoutes)
router.use("/realYouMatters",realYouMattersRoutes)
router.use("/thingsYouLove",thingsYouLoveRoutes)
router.use("/gender",genderRoutes)
// router.use("/users",usersRoutes)
router.use("/user",mobileAuthRoutes,googleAuthRoutes,userManageRoutes)
export default router;


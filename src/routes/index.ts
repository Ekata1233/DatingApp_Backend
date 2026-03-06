import { Router } from "express";
import interestRoutes from "../features/onboarding/interestedIn/interestedIn.routes";
import sexualOrientationRoutes from "../features/onboarding/sexualorientations/sexualorientations.routes";
import lifestyleRoutes from "../features/onboarding/lifestyle/lifestyle.routes";
import realYouMattersRoutes from "../features/onboarding/realYouMatters/realYouMatters.routes";
import thingsYouLoveRoutes from "../features/onboarding/thingsYouLove/thingsYouLove.routes";
import genderRoutes from "../features/onboarding/gender/gender.routes";
import userRoutes from "../features/user/mobile-auth/auth.routes";
import googleRoutes from "../features/user/google-auth/google-auth.routes";

const router = Router();

router.use("/interested-in", interestRoutes);
router.use("/sexual-orientation",sexualOrientationRoutes)
router.use("/lifestyle",lifestyleRoutes)
router.use("/realYouMatters",realYouMattersRoutes)
router.use("/thingsYouLove",thingsYouLoveRoutes)
router.use("/gender",genderRoutes)
// router.use("/users",usersRoutes)
router.use("/user",userRoutes)
router.use("/user",googleRoutes)
export default router;


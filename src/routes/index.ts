import { Router } from "express";
import interestRoutes from "../features/onboarding/interestedIn/interestedIn.routes";
import sexualOrientationRoutes from "../features/onboarding/sexualorientations/sexualorientations.routes";

const router = Router();

router.use("/interested-in", interestRoutes);
router.use("/sexual-orientation",sexualOrientationRoutes)

export default router;


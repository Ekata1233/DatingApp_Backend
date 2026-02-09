import { Router } from "express";
import interestRoutes from "../features/onboarding/interestedIn/interestedIn.routes";
import genderRoutes from "../features/onboarding/interestedIn/interestedIn.routes";

const router = Router();

router.use("/interest", interestRoutes);
router.use("/api/genders", genderRoutes);


export default router;


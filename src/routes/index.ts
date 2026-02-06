import { Router } from "express";
import interestRoutes from "../features/onboarding/interestedIn/interestedIn.routes";

const router = Router();

router.use("/interest", interestRoutes);

export default router;


import { Router } from "express";
import interestRoutes from "../features/onboarding/interestedIn/interestedIn.routes";

const router = Router();

router.use("/interested-in", interestRoutes);

export default router;


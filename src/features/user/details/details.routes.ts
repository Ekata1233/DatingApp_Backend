import express from "express";
import { getUserDetailsController } from "./details.controller";

const router =  express.Router();

router.get("/details/:id", getUserDetailsController);

export default router;
import express from "express";
const router = express.Router();
import { getMessages, sendMessage } from "./message.controller";

router.get("/:receiverId", getMessages);
router.post("/message", sendMessage);

export default router;
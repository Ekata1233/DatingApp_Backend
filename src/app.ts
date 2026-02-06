import express from "express";
import cors from "cors";
import compression from "compression";
import interestedInRoutes from "./features/interestedIn/interestedIn.routes";

const app = express();

app.use(cors());
app.use(compression()); 
app.use(express.json());

app.use("/api/interested-in", interestedInRoutes);

export default app;

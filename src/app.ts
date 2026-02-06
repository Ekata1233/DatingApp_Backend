import express from "express";
import cors from "cors";
import compression from "compression";
import routes from "./routes";

const app = express();

app.use(cors());
app.use(compression()); 
app.use(express.json());

app.use("/api", routes);

export default app;

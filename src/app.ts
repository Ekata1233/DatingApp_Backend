import express from "express";
import cors from "cors";
import compression from "compression";
import fileUpload from "express-fileupload"; // ✅ correct import
import routes from "./routes";

const app = express();

// Middleware
app.use(cors());
app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// File upload middleware
app.use(
  fileUpload({
    useTempFiles: false,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  })
);

// Routes
app.use("/api", routes);

export default app;

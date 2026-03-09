import swaggerUi from "swagger-ui-express";
import { swaggerSpec } from "./config/swagger";
import express from "express";
import cors from "cors";
import compression from "compression";
import fileUpload from "express-fileupload"; // ✅ correct import
import routes from "./routes";

const app = express();

// Middleware
// app.use(
//   cors({
//     origin: process.env.PRODUCTION_URL || process.env.TESTING_URL || "http://localhost:3000",
//     credentials: true
//   })
// );
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

app.use(
  "/api-docs",
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec)
);

// Routes
app.use("/api", routes);

export default app;

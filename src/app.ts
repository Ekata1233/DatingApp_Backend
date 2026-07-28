import corsMiddleware from "./config/cors";
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
app.use(corsMiddleware);
app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
  fileUpload({
    useTempFiles: false,
    limits: {
      fileSize: 30 * 1024 * 1024, // 30 MB
    },
  }),
);

app.get("/api-docs", (req, res) => {
  res.send(`
  <!DOCTYPE html>
  <html>
  <head>
    <title>Dating App API Docs</title>
    <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist/swagger-ui.css" />
  </head>

  <body>
    <div id="swagger-ui"></div>

    <script src="https://unpkg.com/swagger-ui-dist/swagger-ui-bundle.js"></script>
    <script src="https://unpkg.com/swagger-ui-dist/swagger-ui-standalone-preset.js"></script>

    <script>
      window.onload = function () {
        SwaggerUIBundle({
          spec: ${JSON.stringify(swaggerSpec)},
          dom_id: '#swagger-ui',
          presets: [
            SwaggerUIBundle.presets.apis,
            SwaggerUIStandalonePreset
          ],
          layout: "StandaloneLayout",

          operationsSorter: function (a, b) {
          const orderA =
            a.get("operation")?.get("x-sort-order") ??
            a.get("operation")?.toJS()?.["x-sort-order"] ??
            999;

          const orderB =
            b.get("operation")?.get("x-sort-order") ??
            b.get("operation")?.toJS()?.["x-sort-order"] ??
            999;

          return orderA - orderB;
        }
        });
      };
    </script>

  </body>
  </html>
  `);
});
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

// Routes
app.use("/api", routes);

export default app;

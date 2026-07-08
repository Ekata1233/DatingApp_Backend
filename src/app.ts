// import swaggerUi from "swagger-ui-express";
// import { swaggerSpec } from "./config/swagger";
// import express from "express";
// import cors from "cors";
// import compression from "compression";
// import fileUpload from "express-fileupload"; // ✅ correct import
// import routes from "./routes";

// const app = express();

// // Middleware
// // app.use(
// //   cors({
// //     origin: process.env.PRODUCTION_URL || process.env.TESTING_URL || "http://localhost:3000",
// //     credentials: true
// //   })
// // );
// app.use(cors());
// app.use(compression());
// app.use(express.json());
// app.use(express.urlencoded({ extended: true }));

// // File upload middleware
// app.use(
//   fileUpload({
//     useTempFiles: false,
//     limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
//   })
// );

// app.get("/api-docs", (req, res) => {
//   res.send(`
//   <!DOCTYPE html>
//   <html>
//   <head>
//     <title>Dating App API Docs</title>
//     <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist/swagger-ui.css" />
//   </head>

//   <body>
//     <div id="swagger-ui"></div>

//     <script src="https://unpkg.com/swagger-ui-dist/swagger-ui-bundle.js"></script>
//     <script src="https://unpkg.com/swagger-ui-dist/swagger-ui-standalone-preset.js"></script>

//     <script>
//       window.onload = function () {
//         SwaggerUIBundle({
//           spec: ${JSON.stringify(swaggerSpec)},
//           dom_id: '#swagger-ui',
//           presets: [
//             SwaggerUIBundle.presets.apis,
//             SwaggerUIStandalonePreset
//           ],
//           layout: "StandaloneLayout",

//           operationsSorter: function (a, b) {
//           const orderA =
//             a.get("operation")?.get("x-sort-order") ??
//             a.get("operation")?.toJS()?.["x-sort-order"] ??
//             999;

//           const orderB =
//             b.get("operation")?.get("x-sort-order") ??
//             b.get("operation")?.toJS()?.["x-sort-order"] ??
//             999;

//           return orderA - orderB;
//         }
//         });
//       };
//     </script>

//   </body>
//   </html>
//   `);
// });
// app.use((req, res, next) => {
//   console.log(`${req.method} ${req.url}`);
//   next();
// });

// // Routes
// app.use("/api", routes);
// app.use(fileUpload({
//   useTempFiles: false,
// }));
// export default app;


import swaggerUi from "swagger-ui-express";
import { swaggerSpec } from "./config/swagger";
import express from "express";
import cors from "cors";
import compression from "compression";
import fileUpload from "express-fileupload";
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

// ✅ SWAGGER UI - Add this BEFORE routes
console.log("📚 Setting up Swagger UI...");
console.log(`📊 Total API endpoints documented: ${Object.keys(swaggerSpec.paths || {}).length}`);

app.use(
  "/api-docs",
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, {
    swaggerOptions: {
      operationsSorter: (a: any, b: any) => {
        const orderA = a.get("operation")?.get("x-sort-order") ?? 999;
        const orderB = b.get("operation")?.get("x-sort-order") ?? 999;
        return orderA - orderB;
      },
    },
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: "Welvors API Documentation",
  })
);

// ✅ Add JSON endpoint for debugging
app.get("/api-docs-json", (req, res) => {
  res.setHeader("Content-Type", "application/json");
  res.send(swaggerSpec);
});

// ✅ Debug route to check API status
app.get("/api/debug", (req, res) => {
  res.json({
    status: "API is working",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
    swaggerEndpoints: Object.keys(swaggerSpec.paths || {}).length,
  });
});

// Logging middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

// Routes
app.use("/api", routes);

// Health check
app.get("/health", (req, res) => {
  res.status(200).json({ 
    status: "OK", 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
    swagger: {
      docs: `${req.protocol}://${req.get('host')}/api-docs`,
      json: `${req.protocol}://${req.get('host')}/api-docs-json`
    }
  });
});

// ❌ Remove this if you have it - it conflicts with swagger-ui-express
// app.get("/api-docs", (req, res) => { ... });

export default app;
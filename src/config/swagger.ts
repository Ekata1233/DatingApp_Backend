import swaggerJSDoc from "swagger-jsdoc";
import path from "path";

export const options: swaggerJSDoc.Options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Welvors API Documentation",
      version: "1.0.0",
      description:
        "API documentation for Welvors built with Node.js, Express, and TypeScript",
    },
    servers: [
      {
        url: process.env.PRODUCTION_URL || "https://dating-app-backend-plum.vercel.app",
        description: "Production Server",
      },
      {
        url: process.env.TESTING_URL || "http://localhost:4000",
        description: "Local Server",
      },
    ],
    tags: [
      { name: "Onboarding Dynamic Data", description: "Mobile screen data management APIs" },
      { name: "User Mobile Authentication", description: "OTP login and phone verification APIs" },
      { name: "User Profile", description: "All Onboarding Steps APIs" },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description: "Enter your JWT token",
        },
      },
    },
  },
  // Absolute path so it works regardless of cwd during generation
  apis: [path.join(process.cwd(), "src/features/**/*.ts")],
};

// Runtime: use the prebuilt JSON (works on Vercel).
// Fallback to live generation only in local dev if the JSON isn't there yet.
let spec: object;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  spec = require("./swagger.json");
} catch {
  spec = swaggerJSDoc(options);
}

export const swaggerSpec = spec;   
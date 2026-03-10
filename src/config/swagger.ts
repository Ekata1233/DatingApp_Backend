import swaggerJSDoc from "swagger-jsdoc";
import path from "path";

const options: swaggerJSDoc.Options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Dating App API Documentation",
      version: "1.0.0",
      description:
        "API documentation for Dating App built with Node.js, Express, and TypeScript",
    },
    servers: [
      {
        url: process.env.TESTING_URL || "http://localhost:5000",
        description: "Local Server",
      },
      {
        url: process.env.PRODUCTION_URL || "https://dating-app-backend-plum.vercel.app",
        description: "Production Server",
      },
    ],
    tags: [
      {
        name: "Dynamic Onboarding Data",
        description: "Dynamic onboarding data management APIs",
      },
      {
        name: "User Mobile Authentication",
        description: "OTP login and phone verification APIs",
      },
      {
        name: "User Google Authentication",
        description: "Google login and email verification APIs",
      },
      {
        name: "Users Management",
        description: "User management APIs",
      },
    ],
  },

  // ✅ FIXED: Multiple path patterns for TypeScript/JavaScript
  apis: [
    // For local development (TypeScript)
    path.join(__dirname, "../src/features/**/*.ts"),
    path.join(__dirname, "./src/features/**/*.ts"),
    
    // For production build (JavaScript)
    path.join(__dirname, "../dist/features/**/*.js"),
    path.join(__dirname, "./dist/features/**/*.js"),
    path.join(process.cwd(), "dist/features/**/*.js"),
  ],
};

export const swaggerSpec = swaggerJSDoc(options);
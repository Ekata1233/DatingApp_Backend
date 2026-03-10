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
        url: process.env.TESTING_URL || "http://localhost:4000",
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
      {
        name: "User Profile",
        description: "User onboarding profile APIs",
      },
    ],
  },

  // ✅ important fix
  apis: [
    path.join(process.cwd(), "src/**/*.ts"),
    path.join(process.cwd(), "dist/**/*.js"),
  ],
};

export const swaggerSpec = swaggerJSDoc(options);

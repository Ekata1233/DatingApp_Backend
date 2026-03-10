import swaggerJSDoc from "swagger-jsdoc";

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Dating App API Documentation",
      version: "1.0.0",
      description: "API documentation for Dating App built with Node.js, Express, and TypeScript",
    },
    servers: [
      {
        url: process.env.TESTING_URL || "http://localhost:3000",
        description: "Local Server",
      },
      {
        url: process.env.PRODUCTION_URL || `https://${process.env.PRODUCTION_URL}`,
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
  apis: [
    "./src/features/**/*.ts",
    "./dist/features/**/*.js",
  ],
} as swaggerJSDoc.Options; // Type assertion here

export const swaggerSpec = swaggerJSDoc(options);
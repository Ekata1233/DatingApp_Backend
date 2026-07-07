import swaggerJSDoc from "swagger-jsdoc";
import path from "path";

const options: swaggerJSDoc.Options = {
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
      {
        name: "Onboarding Dynamic Data",
        description: "Mobile screen data management APIs",
      },
      {
        name: "User Mobile Authentication",
        description: "OTP login and phone verification APIs",
      },
    ],
  },

  // ✅ important fix
 apis: [path.join(process.cwd(), "src/features/**/*.ts")],
};

export const swaggerSpec = swaggerJSDoc(options);

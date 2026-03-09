import swaggerJSDoc from "swagger-jsdoc";

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
        url: process.env.TESTING_URL,
        description: "Local Server",
      },
      {
        url: process.env.PRODUCTION_URL,
        description: "Production Server",
      },
    ],
    tags: [
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

  apis: ["./src/features/**/*.ts"],
};

export const swaggerSpec = swaggerJSDoc(options);

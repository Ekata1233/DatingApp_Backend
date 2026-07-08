// import swaggerJSDoc from "swagger-jsdoc";

// const options: swaggerJSDoc.Options = {
//   definition: {
//     openapi: "3.0.0",
//     info: {
//       title: "Welvors API Documentation",
//       version: "1.0.0",
//       description:
//         "API documentation for Welvors built with Node.js, Express, and TypeScript",
//     },

//     servers: [
//       {
//         url: process.env.PRODUCTION_URL || "https://dating-app-backend-plum.vercel.app",
//         description: "Production Server",
//       },
//       {
//         url: process.env.TESTING_URL || "http://localhost:4000",
//         description: "Local Server",
//       },
//     ],

//     tags: [
//       {
//         name: "Onboarding Dynamic Data",
//         description: "Mobile screen data management APIs",
//       },
//       {
//         name: "User Mobile Authentication",
//         description: "OTP login and phone verification APIs",
//       },
//       {
//         name: "User Profile",
//         description: "All Onboarding Steps APIs",
//       },
//     ],

//     // ✅ Add this section
//     components: {
//       securitySchemes: {
//         bearerAuth: {
//           type: "http",
//           scheme: "bearer",
//           bearerFormat: "JWT",
//           description: "Enter your JWT token",
//         },
//       },
//     },
//   },

//   // ✅ important fix
//   apis: [
//     "src/features/**/*.ts",
//   ],
// };

// export const swaggerSpec = swaggerJSDoc(options);


import swaggerJSDoc from "swagger-jsdoc";
import path from "path";

// ✅ Determine environment
const isProduction = process.env.NODE_ENV === 'production';
console.log(`🔍 Swagger running in ${isProduction ? 'production' : 'development'} mode`);

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
      {
        name: "User Profile",
        description: "All Onboarding Steps APIs",
      },
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
  // ✅ FIXED: Use correct paths for both development and production
  apis: [
    // Development paths (.ts files)
    "./src/features/**/*.ts",
    "./src/routes/**/*.ts",
    "./src/**/*.routes.ts",
    // Production paths (.js files after compilation)
    "./dist/features/**/*.js",
    "./dist/routes/**/*.js",
    "./dist/**/*.routes.js",
    // Alternative patterns
    "src/features/**/*.ts",
    "src/routes/**/*.ts",
    "dist/features/**/*.js",
    "dist/routes/**/*.js",
  ],
};

console.log("🔍 Swagger looking for files in:");
options.apis.forEach(api => console.log(`  - ${api}`));

export const swaggerSpec = swaggerJSDoc(options);

// ✅ Log detailed information about found endpoints
const endpoints = Object.keys(swaggerSpec.paths || {});
console.log(`📊 Total API endpoints found: ${endpoints.length}`);

if (endpoints.length === 0) {
  console.warn("⚠️ No Swagger endpoints found! Checking possible issues:");
  console.warn("  1. Are your route files in the correct location?");
  console.warn("  2. Do your route files have @swagger annotations?");
  console.warn("  3. Have you built the project with 'npm run build'?");
  console.warn("  4. Are the file paths in 'apis' array correct?");
} else {
  console.log("📌 Endpoints found:");
  endpoints.forEach(path => console.log(`  - ${path}`));
}

// ✅ Log tags found
const tags = swaggerSpec.tags || [];
console.log(`🏷️ Tags found: ${tags.map(t => t.name).join(', ') || 'None'}`);
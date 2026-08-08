// import fs from "fs";
// import path from "path";
// import { swaggerSpec } from "../src/config/swagger";

// fs.writeFileSync(
//   path.join(__dirname, "../src/config/swagger.generated.json"),
//   JSON.stringify(swaggerSpec, null, 2)
// );
// console.log("swagger.generated.json written");

// import fs from "fs";
// import path from "path";
// import { options } from "../src/config/swagger";
// import swaggerJSDoc from "swagger-jsdoc";

// const spec = swaggerJSDoc(options) as { paths?: Record<string, unknown> };

// const outPath = path.join(process.cwd(), "src/config/swagger.json");
// fs.writeFileSync(outPath, JSON.stringify(spec, null, 2), "utf-8");

// const count = Object.keys(spec.paths || {}).length;
// console.log(`✅ swagger.json generated with ${count} paths`);

// if (count === 0) {
//   console.warn("⚠️  0 paths found — check that your glob matches your route files.");
// }


import fs from "fs";
import path from "path";
import swaggerJSDoc from "swagger-jsdoc";

const options: swaggerJSDoc.Options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Staybea Backend API",
      version: "1.0.0",
      description: "Staybea Backend API Documentation",
    },
  },

  apis: [
    path.join(process.cwd(), "src/routes/**/*.ts"),
    path.join(process.cwd(), "src/controllers/**/*.ts"),
  ],
};

const spec = swaggerJSDoc(options) as {
  paths?: Record<string, unknown>;
};

const outPath = path.join(
  process.cwd(),
  "src/config/swagger.json"
);

fs.writeFileSync(
  outPath,
  JSON.stringify(spec, null, 2),
  "utf-8"
);

const count = Object.keys(spec.paths || {}).length;

console.log(`✅ swagger.json generated with ${count} paths`);

if (count === 0) {
  console.warn(
    "⚠️  0 paths found — check that your glob matches your route files."
  );
}

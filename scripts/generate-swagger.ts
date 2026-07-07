import fs from "fs";
import path from "path";
import { swaggerSpec } from "../src/config/swagger";

fs.writeFileSync(
  path.join(__dirname, "../src/config/swagger.generated.json"),
  JSON.stringify(swaggerSpec, null, 2)
);
console.log("swagger.generated.json written");
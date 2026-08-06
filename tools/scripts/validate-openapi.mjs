import { readFileSync } from "node:fs";
import YAML from "yaml";

const source = readFileSync("openapi.yaml", "utf8");
const document = YAML.parse(source);

const requiredTopLevelKeys = ["openapi", "info", "paths", "components"];
const missing = requiredTopLevelKeys.filter((key) => document[key] === undefined);

if (missing.length > 0) {
  throw new Error(`openapi.yaml is missing required top-level keys: ${missing.join(", ")}`);
}

if (document.openapi !== "3.1.0") {
  throw new Error("openapi.yaml must declare OpenAPI 3.1.0");
}

if (Object.keys(document.paths).length === 0) {
  throw new Error("openapi.yaml must contain the documented API paths");
}

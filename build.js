import { redirectErrorsToConsole } from "@oliversalzburg/js-utils/errors/console.js";
import esbuild from "esbuild";

esbuild
  .build({
    bundle: true,
    entryPoints: ["./source/main.ts"],
    format: "esm",
    outfile: "./output/main.js",
    packages: "external",
    platform: "node",
    target: "node22",
  })
  .catch(redirectErrorsToConsole(console));

import path from "node:path";
import solidPlugin from "../node_modules/@opentui/solid/scripts/solid-plugin.ts";

const targets: Record<NodeJS.Platform, Record<string, string>> = {
  darwin: { arm64: "bun-darwin-arm64", x64: "bun-darwin-x64" },
  linux: { arm64: "bun-linux-arm64", x64: "bun-linux-x64" },
  win32: { x64: "bun-windows-x64" },
};

const platformTargets = targets[process.platform];
const compileTarget = platformTargets?.[process.arch];

if (!compileTarget) {
  console.error(`Unsupported platform/arch combo: ${process.platform}/${process.arch}`);
  process.exit(1);
}

const outfile = path.join("dist", "eidolon");

const result = await Bun.build({
  entrypoints: ["./packages/eidolon-cli/src/index.tsx"],
  target: "bun",
  plugins: [solidPlugin],
  sourcemap: "none",
  compile: {
    target: compileTarget,
    outfile,
  },
});

if (!result.success) {
  console.error("Build failed:");
  for (const message of result.logs) {
    console.error(message.message);
  }
  process.exit(1);
}

console.log(`Built standalone binary at ${outfile}`);

import { cp, mkdir, readFile, writeFile } from "node:fs/promises";
import { build } from "esbuild";

const configuredUrl = process.env.PHONE_WHEEL_SERVICE_URL;
if (!configuredUrl)
  throw new Error("Set PHONE_WHEEL_SERVICE_URL to the hosted HTTPS controller service.");
const serviceUrl = new URL(configuredUrl);
if (
  serviceUrl.protocol !== "https:" ||
  serviceUrl.username ||
  serviceUrl.password ||
  serviceUrl.pathname !== "/" ||
  serviceUrl.search ||
  serviceUrl.hash
) {
  throw new Error(
    "PHONE_WHEEL_SERVICE_URL must be an HTTPS origin without a path, query or credentials.",
  );
}

const outputDirectory = "build/wmmtd-extension";
const manifest = JSON.parse(await readFile("extension/manifest.json", "utf8")) as {
  host_permissions: string[];
};
manifest.host_permissions.push(`${serviceUrl.origin}/*`);
await mkdir(outputDirectory, { recursive: true });
await writeFile(
  `${outputDirectory}/manifest.json`,
  `${JSON.stringify(manifest, null, 2)}\n`,
);
await Promise.all(
  ["popup.html"].map((name: string) =>
    cp(`extension/${name}`, `${outputDirectory}/${name}`),
  ),
);
await build({
  entryPoints: [
    "extension/background.ts",
    "extension/bridge.ts",
    "extension/gamepad.ts",
    "extension/popup.tsx",
  ],
  outdir: outputDirectory,
  bundle: true,
  platform: "browser",
  target: "chrome116",
  format: "iife",
  minify: true,
  define: {
    PHONE_WHEEL_SERVICE_URL: JSON.stringify(serviceUrl.origin),
    "process.env.NODE_ENV": '"production"',
  },
});
console.log(`Built ${outputDirectory} for ${serviceUrl.origin}`);

import { mkdir, writeFile } from "node:fs/promises";
import { tokens } from "../tokens/index";
import { serializeThemeCss } from "./token-css";

const stylesDirectory = new URL("../styles/", import.meta.url);

await mkdir(stylesDirectory, { recursive: true });
await writeFile(
	new URL("theme.css", stylesDirectory),
	serializeThemeCss(tokens),
);

console.log("Generated styles/theme.css");

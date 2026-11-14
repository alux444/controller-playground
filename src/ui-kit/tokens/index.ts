import { baseTokens } from "./base";
import { componentTokens } from "./components";
import { themeTokens } from "./theme";
import type { KitTokens } from "./types";

export const tokens = {
	...baseTokens,
	...themeTokens,
	component: componentTokens,
} satisfies KitTokens;

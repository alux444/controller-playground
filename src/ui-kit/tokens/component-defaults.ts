export const semanticButtonAppearances = {
	primary: {
		default: {
			background: "action.primary",
			foreground: "action.primary.foreground",
			border: "transparent",
		},
		hover: {
			background: "action.primary.hover",
			foreground: "action.primary.foreground",
			border: "transparent",
		},
	},
	destructive: {
		default: {
			background: "action.destructive",
			foreground: "action.destructive.foreground",
			border: "transparent",
		},
		hover: {
			background: "action.destructive.hover",
			foreground: "action.destructive.foreground",
			border: "transparent",
		},
	},
	quiet: {
		default: {
			background: "transparent",
			foreground: "foreground.muted",
			border: "transparent",
		},
		hover: {
			background: "transparent",
			foreground: "foreground.default",
			border: "transparent",
		},
	},
} as const;

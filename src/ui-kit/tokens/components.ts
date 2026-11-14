import type { ClientComponentTokens } from "./types";

export const componentTokens = {
	button: {
		size: {
			sm: {
				gap: "space.50",
				paddingBlock: "space.50",
				paddingInline: "space.150",
				fontSize: "font.size.200",
				lineHeight: "font.line-height.500",
				fontWeight: "font.weight.semibold",
			},
			md: {
				gap: "space.75",
				paddingBlock: "space.75",
				paddingInline: "space.200",
				fontSize: "font.size.200",
				lineHeight: "font.line-height.500",
				fontWeight: "font.weight.semibold",
			},
			lg: {
				gap: "space.100",
				paddingBlock: "space.75",
				paddingInline: "space.250",
				fontSize: "font.size.300",
				lineHeight: "font.line-height.400",
				fontWeight: "font.weight.semibold",
			},
		},
		appearance: {
			secondary: {
				default: {
					background: "background.surface",
					foreground: "foreground.default",
					border: "border.default",
				},
				hover: {
					background: "background.canvas",
					foreground: "foreground.default",
					border: "border.default",
				},
			},
		},
	},
	input: {
		size: {
			sm: {
				gap: "space.75",
				paddingInline: "space.150",
				fontSize: "font.size.200",
				lineHeight: "font.line-height.500",
				fontWeight: "font.weight.medium",
			},
			md: {
				gap: "space.75",
				paddingInline: "space.200",
				fontSize: "font.size.200",
				lineHeight: "font.line-height.500",
				fontWeight: "font.weight.medium",
			},
			lg: {
				gap: "space.100",
				paddingInline: "space.200",
				fontSize: "font.size.300",
				lineHeight: "font.line-height.400",
				fontWeight: "font.weight.medium",
			},
		},
	},
	dropdownMenu: {
		padding: "space.50",
		itemGap: "space.100",
		itemPaddingInline: "space.100",
	},
	table: {
		headerBackground: "background.canvas",
		cellPaddingBlock: "space.150",
		cellPaddingInline: "space.200",
		compactCellPaddingBlock: "space.100",
		compactCellPaddingInline: "space.150",
		cardHeaderPaddingBlock: "space.200",
		cardHeaderPaddingInline: "space.300",
		compactCardHeaderPaddingBlock: "space.150",
		compactCardHeaderPaddingInline: "space.250",
		cardHeaderGap: "space.200",
	},
	toast: {
		padding: "space.200",
		gap: "space.150",
	},
} satisfies ClientComponentTokens;

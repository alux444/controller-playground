import type { ClientBaseTokens } from "./types";

export const baseTokens = {
	typography: {
		fontFamily: {
			body: "system-ui, sans-serif",
			heading: "system-ui, sans-serif",
		},
		fontSize: {
			100: "0.75rem",
			200: "0.875rem",
			300: "1rem",
			400: "1.125rem",
			500: "1.5rem",
			600: "1.875rem",
			700: "2.25rem",
		},
		lineHeight: {
			100: "1.2",
			200: "1.25",
			300: "1.35",
			400: "1.5",
			500: "1.6",
		},
		fontWeight: {
			regular: 400,
			medium: 500,
			semibold: 600,
			bold: 700,
		},
		role: {
			"body.small": {
				fontSize: "font.size.200",
				lineHeight: "font.line-height.500",
				fontWeight: "font.weight.regular",
			},
			"body.medium": {
				fontSize: "font.size.300",
				lineHeight: "font.line-height.400",
				fontWeight: "font.weight.regular",
			},
			"body.large": {
				fontSize: "font.size.400",
				lineHeight: "font.line-height.400",
				fontWeight: "font.weight.regular",
			},
			"heading.small": {
				fontSize: "font.size.500",
				lineHeight: "font.line-height.300",
				fontWeight: "font.weight.semibold",
			},
			"heading.medium": {
				fontSize: "font.size.600",
				lineHeight: "font.line-height.200",
				fontWeight: "font.weight.semibold",
			},
			"heading.large": {
				fontSize: "font.size.700",
				lineHeight: "font.line-height.100",
				fontWeight: "font.weight.semibold",
			},
			"overlay.title": {
				fontSize: "font.size.400",
				lineHeight: "font.line-height.300",
				fontWeight: "font.weight.semibold",
			},
			"overlay.description": {
				fontSize: "font.size.200",
				lineHeight: "font.line-height.500",
				fontWeight: "font.weight.regular",
			},
			"card.title": {
				fontSize: "font.size.300",
				lineHeight: "font.line-height.400",
				fontWeight: "font.weight.semibold",
			},
			"card.description": {
				fontSize: "font.size.200",
				lineHeight: "font.line-height.500",
				fontWeight: "font.weight.regular",
			},
			"menu.item": {
				fontSize: "font.size.200",
				lineHeight: "font.line-height.500",
				fontWeight: "font.weight.medium",
			},
			"toast.title": {
				fontSize: "font.size.200",
				lineHeight: "font.line-height.400",
				fontWeight: "font.weight.semibold",
			},
			"table.header": {
				fontSize: "font.size.200",
				lineHeight: "font.line-height.500",
				fontWeight: "font.weight.regular",
			},
			"table.body": {
				fontSize: "font.size.200",
				lineHeight: "font.line-height.500",
				fontWeight: "font.weight.regular",
			},
			"table.card-title": {
				fontSize: "font.size.400",
				lineHeight: "font.line-height.400",
				fontWeight: "font.weight.regular",
			},
			"table.card-description": {
				fontSize: "font.size.200",
				lineHeight: "font.line-height.500",
				fontWeight: "font.weight.regular",
			},
		},
	},
	spacing: {
		scale: {
			0: "0px",
			25: "2px",
			50: "4px",
			75: "6px",
			100: "8px",
			150: "12px",
			200: "16px",
			250: "20px",
			300: "24px",
			400: "32px",
			500: "40px",
			600: "48px",
			800: "64px",
			1000: "80px",
		},
		density: {
			compact: {
				"control.gap": "space.50",
				"control.padding.block": "space.75",
				"control.padding.inline": "space.100",
				"content.gap": "space.50",
				"layout.gutter": "space.150",
				"section.gap": "space.200",
			},
			default: {
				"control.gap": "space.75",
				"control.padding.block": "space.100",
				"control.padding.inline": "space.150",
				"content.gap": "space.100",
				"layout.gutter": "space.200",
				"section.gap": "space.300",
			},
			comfortable: {
				"control.gap": "space.100",
				"control.padding.block": "space.150",
				"control.padding.inline": "space.200",
				"content.gap": "space.200",
				"layout.gutter": "space.400",
				"section.gap": "space.800",
			},
		},
	},
	sizing: {
		scale: {
			100: "16px",
			150: "20px",
			200: "24px",
			250: "28px",
			300: "32px",
			350: "36px",
			400: "40px",
			500: "48px",
			600: "56px",
			800: "64px",
		},
		role: {
			"control.sm": "size.300",
			"control.md": "size.350",
			"control.lg": "size.400",
			"control.close": "size.300",
			"dialog.close": "size.350",
			"menu.item": "size.300",
		},
	},
	radius: {
		scale: {
			0: "0px",
			50: "2px",
			100: "4px",
			150: "6px",
			200: "8px",
			300: "12px",
			400: "16px",
			full: "9999px",
		},
		role: {
			control: "radius.200",
			card: "radius.300",
			overlay: "radius.300",
			pill: "radius.full",
		},
	},
	border: {
		width: {
			0: "0px",
			100: "1px",
			200: "2px",
			400: "4px",
		},
		role: {
			default: "border.width.100",
			selected: "border.width.200",
			focused: "border.width.200",
		},
	},
	elevation: {
		shadow: {
			0: {
				color: "transparent",
				offsetX: "0px",
				offsetY: "0px",
				blur: "0px",
				spread: "0px",
			},
			100: {
				color: "rgb(16 24 40 / 5%)",
				offsetX: "0px",
				offsetY: "1px",
				blur: "2px",
				spread: "0px",
			},
			200: {
				color: "rgb(16 24 40 / 10%)",
				offsetX: "0px",
				offsetY: "4px",
				blur: "8px",
				spread: "-2px",
			},
			300: {
				color: "rgb(16 24 40 / 14%)",
				offsetX: "0px",
				offsetY: "12px",
				blur: "24px",
				spread: "-4px",
			},
		},
		role: {
			surface: "shadow.0",
			raised: "shadow.100",
			overlay: "shadow.300",
			"component.surface": "shadow.100",
			"component.overlay": "shadow.300",
			"component.menu": "shadow.200",
		},
	},
	opacity: {
		scale: {
			0: 0,
			25: 0.25,
			50: 0.5,
			75: 0.75,
			100: 1,
		},
		role: {
			disabled: "opacity.50",
			subtle: "opacity.75",
			backdrop: "opacity.50",
		},
	},
	motion: {
		duration: {
			0: {
				value: 0,
				unit: "ms",
			},
			100: {
				value: 120,
				unit: "ms",
			},
			150: {
				value: 160,
				unit: "ms",
			},
			200: {
				value: 200,
				unit: "ms",
			},
			250: {
				value: 240,
				unit: "ms",
			},
			300: {
				value: 320,
				unit: "ms",
			},
		},
		easing: {
			linear: [0, 0, 1, 1],
			standard: [0.2, 0, 0, 1],
			decelerate: [0, 0, 0.2, 1],
			accelerate: [0.4, 0, 1, 1],
			emphasized: [0.2, 0.8, 0.2, 1],
		},
		role: {
			instant: {
				duration: "duration.0",
				easing: "easing.linear",
			},
			feedback: {
				duration: "duration.100",
				easing: "easing.standard",
			},
			enter: {
				duration: "duration.200",
				easing: "easing.decelerate",
			},
			exit: {
				duration: "duration.150",
				easing: "easing.accelerate",
			},
			move: {
				duration: "duration.250",
				easing: "easing.standard",
			},
			emphasis: {
				duration: "duration.300",
				easing: "easing.emphasized",
			},
		},
	},
	icon: {
		size: {
			sm: "size.100",
			md: "size.150",
			lg: "size.200",
			xl: "size.300",
		},
		role: {
			"control.sm": "sm",
			"control.md": "sm",
			"control.lg": "md",
		},
		stroke: {
			scale: {
				100: "1px",
				150: "1.5px",
				200: "2px",
			},
			role: {
				subtle: "icon.stroke.100",
				default: "icon.stroke.150",
				emphasis: "icon.stroke.200",
			},
		},
	},
	layout: {
		width: {
			scale: {
				256: "256px",
				320: "320px",
				384: "384px",
				448: "448px",
				512: "512px",
				640: "640px",
				768: "768px",
				896: "896px",
				1024: "1024px",
				1152: "1152px",
				1280: "1280px",
			},
			role: {
				"content.narrow": "layout.width.640",
				"content.default": "layout.width.768",
				"content.wide": "layout.width.1024",
				page: "layout.width.1280",
				"overlay.sm": "layout.width.384",
				"overlay.md": "layout.width.512",
				"overlay.lg": "layout.width.640",
				"menu.min": "layout.width.256",
			},
		},
	},
} satisfies ClientBaseTokens;

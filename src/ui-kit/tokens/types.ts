export type ClientBaseTokens = {
	typography: {
		fontFamily: {
			body: string;
			heading: string;
		};
		fontSize: {
			100: string;
			200: string;
			300: string;
			400: string;
			500: string;
			600: string;
			700: string;
		};
		lineHeight: {
			100: string;
			200: string;
			300: string;
			400: string;
			500: string;
		};
		fontWeight: {
			regular: number;
			medium: number;
			semibold: number;
			bold: number;
		};
		role: {
			"body.small": {
				fontSize: string;
				lineHeight: string;
				fontWeight: string;
			};
			"body.medium": {
				fontSize: string;
				lineHeight: string;
				fontWeight: string;
			};
			"body.large": {
				fontSize: string;
				lineHeight: string;
				fontWeight: string;
			};
			"heading.small": {
				fontSize: string;
				lineHeight: string;
				fontWeight: string;
			};
			"heading.medium": {
				fontSize: string;
				lineHeight: string;
				fontWeight: string;
			};
			"heading.large": {
				fontSize: string;
				lineHeight: string;
				fontWeight: string;
			};
			"overlay.title": {
				fontSize: string;
				lineHeight: string;
				fontWeight: string;
			};
			"overlay.description": {
				fontSize: string;
				lineHeight: string;
				fontWeight: string;
			};
			"card.title": {
				fontSize: string;
				lineHeight: string;
				fontWeight: string;
			};
			"card.description": {
				fontSize: string;
				lineHeight: string;
				fontWeight: string;
			};
			"menu.item": {
				fontSize: string;
				lineHeight: string;
				fontWeight: string;
			};
			"toast.title": {
				fontSize: string;
				lineHeight: string;
				fontWeight: string;
			};
			"table.header": {
				fontSize: string;
				lineHeight: string;
				fontWeight: string;
			};
			"table.body": {
				fontSize: string;
				lineHeight: string;
				fontWeight: string;
			};
			"table.card-title": {
				fontSize: string;
				lineHeight: string;
				fontWeight: string;
			};
			"table.card-description": {
				fontSize: string;
				lineHeight: string;
				fontWeight: string;
			};
		};
	};
	spacing: {
		scale: {
			0: string;
			25: string;
			50: string;
			75: string;
			100: string;
			150: string;
			200: string;
			250: string;
			300: string;
			400: string;
			500: string;
			600: string;
			800: string;
			1000: string;
		};
		density: {
			compact: {
				"control.gap": string;
				"control.padding.block": string;
				"control.padding.inline": string;
				"content.gap": string;
				"layout.gutter": string;
				"section.gap": string;
			};
			default: {
				"control.gap": string;
				"control.padding.block": string;
				"control.padding.inline": string;
				"content.gap": string;
				"layout.gutter": string;
				"section.gap": string;
			};
			comfortable: {
				"control.gap": string;
				"control.padding.block": string;
				"control.padding.inline": string;
				"content.gap": string;
				"layout.gutter": string;
				"section.gap": string;
			};
		};
	};
	sizing: {
		scale: {
			100: string;
			150: string;
			200: string;
			250: string;
			300: string;
			350: string;
			400: string;
			500: string;
			600: string;
			800: string;
		};
		role: {
			"control.sm": string;
			"control.md": string;
			"control.lg": string;
			"control.close": string;
			"dialog.close": string;
			"menu.item": string;
		};
	};
	radius: {
		scale: {
			0: string;
			50: string;
			100: string;
			150: string;
			200: string;
			300: string;
			400: string;
			full: string;
		};
		role: {
			control: string;
			card: string;
			overlay: string;
			pill: string;
		};
	};
	border: {
		width: {
			0: string;
			100: string;
			200: string;
			400: string;
		};
		role: {
			default: string;
			selected: string;
			focused: string;
		};
	};
	elevation: {
		shadow: {
			0: {
				color: string;
				offsetX: string;
				offsetY: string;
				blur: string;
				spread: string;
			};
			100: {
				color: string;
				offsetX: string;
				offsetY: string;
				blur: string;
				spread: string;
			};
			200: {
				color: string;
				offsetX: string;
				offsetY: string;
				blur: string;
				spread: string;
			};
			300: {
				color: string;
				offsetX: string;
				offsetY: string;
				blur: string;
				spread: string;
			};
		};
		role: {
			surface: string;
			raised: string;
			overlay: string;
			"component.surface": string;
			"component.overlay": string;
			"component.menu": string;
		};
	};
	opacity: {
		scale: {
			0: number;
			25: number;
			50: number;
			75: number;
			100: number;
		};
		role: {
			disabled: string;
			subtle: string;
			backdrop: string;
		};
	};
	motion: {
		duration: {
			0: {
				value: number;
				unit: string;
			};
			100: {
				value: number;
				unit: string;
			};
			150: {
				value: number;
				unit: string;
			};
			200: {
				value: number;
				unit: string;
			};
			250: {
				value: number;
				unit: string;
			};
			300: {
				value: number;
				unit: string;
			};
		};
		easing: {
			linear: readonly [number, number, number, number];
			standard: readonly [number, number, number, number];
			decelerate: readonly [number, number, number, number];
			accelerate: readonly [number, number, number, number];
			emphasized: readonly [number, number, number, number];
		};
		role: {
			instant: {
				duration: string;
				easing: string;
			};
			feedback: {
				duration: string;
				easing: string;
			};
			enter: {
				duration: string;
				easing: string;
			};
			exit: {
				duration: string;
				easing: string;
			};
			move: {
				duration: string;
				easing: string;
			};
			emphasis: {
				duration: string;
				easing: string;
			};
		};
	};
	icon: {
		size: {
			sm: string;
			md: string;
			lg: string;
			xl: string;
		};
		role: {
			"control.sm": string;
			"control.md": string;
			"control.lg": string;
		};
		stroke: {
			scale: {
				100: string;
				150: string;
				200: string;
			};
			role: {
				subtle: string;
				default: string;
				emphasis: string;
			};
		};
	};
	layout: {
		width: {
			scale: {
				256: string;
				320: string;
				384: string;
				448: string;
				512: string;
				640: string;
				768: string;
				896: string;
				1024: string;
				1152: string;
				1280: string;
			};
			role: {
				"content.narrow": string;
				"content.default": string;
				"content.wide": string;
				page: string;
				"overlay.sm": string;
				"overlay.md": string;
				"overlay.lg": string;
				"menu.min": string;
			};
		};
	};
};

export type ClientThemeTokens = {
	color: {
		brand: {
			50: string;
			100: string;
			200: string;
			300: string;
			400: string;
			500: string;
			600: string;
			700: string;
			800: string;
			900: string;
			950: string;
		};
		secondary: {
			50: string;
			100: string;
			200: string;
			300: string;
			400: string;
			500: string;
			600: string;
			700: string;
			800: string;
			900: string;
			950: string;
		};
		neutral: {
			50: string;
			100: string;
			200: string;
			300: string;
			400: string;
			500: string;
			600: string;
			700: string;
			800: string;
			900: string;
			950: string;
		};
		info: {
			50: string;
			100: string;
			200: string;
			300: string;
			400: string;
			500: string;
			600: string;
			700: string;
			800: string;
			900: string;
			950: string;
		};
		success: {
			50: string;
			100: string;
			200: string;
			300: string;
			400: string;
			500: string;
			600: string;
			700: string;
			800: string;
			900: string;
			950: string;
		};
		warning: {
			50: string;
			100: string;
			200: string;
			300: string;
			400: string;
			500: string;
			600: string;
			700: string;
			800: string;
			900: string;
			950: string;
		};
		danger: {
			50: string;
			100: string;
			200: string;
			300: string;
			400: string;
			500: string;
			600: string;
			700: string;
			800: string;
			900: string;
			950: string;
		};
		semantic: {
			light: {
				"background.canvas": string;
				"background.surface": string;
				"background.subdued": string;
				"background.component": string;
				"background.overlay": string;
				"foreground.default": string;
				"foreground.muted": string;
				"border.default": string;
				"border.hover": string;
				"border.focus": string;
				"border.component": string;
				"border.control": string;
				"action.primary": string;
				"action.primary.hover": string;
				"action.primary.foreground": string;
				"action.destructive": string;
				"action.destructive.hover": string;
				"action.destructive.foreground": string;
				"feedback.default.foreground": string;
				"feedback.info.foreground": string;
				"feedback.success.foreground": string;
				"feedback.warning.foreground": string;
				"feedback.danger.foreground": string;
				"state.selected.background": string;
				"state.selected.foreground": string;
				"state.hover.background": string;
			};
			dark: {
				"background.canvas": string;
				"background.surface": string;
				"background.subdued": string;
				"background.component": string;
				"background.overlay": string;
				"foreground.default": string;
				"foreground.muted": string;
				"border.default": string;
				"border.hover": string;
				"border.focus": string;
				"border.component": string;
				"border.control": string;
				"action.primary": string;
				"action.primary.hover": string;
				"action.primary.foreground": string;
				"action.destructive": string;
				"action.destructive.hover": string;
				"action.destructive.foreground": string;
				"feedback.default.foreground": string;
				"feedback.info.foreground": string;
				"feedback.success.foreground": string;
				"feedback.warning.foreground": string;
				"feedback.danger.foreground": string;
				"state.selected.background": string;
				"state.selected.foreground": string;
				"state.hover.background": string;
			};
		};
	};
	focus: {
		color: string;
		width: string;
		offset: string;
	};
};

export type ClientComponentTokens = {
	button: {
		size: {
			sm: {
				gap: string;
				paddingBlock: string;
				paddingInline: string;
				fontSize: string;
				lineHeight: string;
				fontWeight: string;
			};
			md: {
				gap: string;
				paddingBlock: string;
				paddingInline: string;
				fontSize: string;
				lineHeight: string;
				fontWeight: string;
			};
			lg: {
				gap: string;
				paddingBlock: string;
				paddingInline: string;
				fontSize: string;
				lineHeight: string;
				fontWeight: string;
			};
		};
		appearance: {
			secondary: {
				default: {
					background: string;
					foreground: string;
					border: string;
				};
				hover: {
					background: string;
					foreground: string;
					border: string;
				};
			};
		};
	};
	input: {
		size: {
			sm: {
				gap: string;
				paddingInline: string;
				fontSize: string;
				lineHeight: string;
				fontWeight: string;
			};
			md: {
				gap: string;
				paddingInline: string;
				fontSize: string;
				lineHeight: string;
				fontWeight: string;
			};
			lg: {
				gap: string;
				paddingInline: string;
				fontSize: string;
				lineHeight: string;
				fontWeight: string;
			};
		};
	};
	dropdownMenu: {
		padding: string;
		itemGap: string;
		itemPaddingInline: string;
	};
	table: {
		headerBackground: string;
		cellPaddingBlock: string;
		cellPaddingInline: string;
		compactCellPaddingBlock: string;
		compactCellPaddingInline: string;
		cardHeaderPaddingBlock: string;
		cardHeaderPaddingInline: string;
		compactCardHeaderPaddingBlock: string;
		compactCardHeaderPaddingInline: string;
		cardHeaderGap: string;
	};
	toast: {
		padding: string;
		gap: string;
	};
};

export type KitTokens = ClientBaseTokens & ClientThemeTokens & {
	component: ClientComponentTokens;
};

export type LayoutWidthRoleName = keyof KitTokens["layout"]["width"]["role"];

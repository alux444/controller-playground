import { semanticButtonAppearances } from "../tokens/component-defaults";
import type { KitTokens } from "../tokens/types";

type Variables = Record<string, string | number>;
const variable = (reference: string) =>
	`var(--${reference.replaceAll(".", "-")})`;

function getVariables(tokens: KitTokens, mode: "light" | "dark") {
	const output: Variables = {};
	for (const [scale, values] of Object.entries(tokens.color)) {
		if (scale === "semantic") continue;
		for (const [step, value] of Object.entries(values)) {
			output[`--color-${scale}-${step}`] = value;
		}
	}
	for (const [name, reference] of Object.entries(tokens.color.semantic[mode])) {
		output[`--color-${name.replaceAll(".", "-")}`] = variable(
			`color.${reference}`,
		);
	}
	const scales = [
		[tokens.typography.fontFamily, "font-family"],
		[tokens.typography.fontSize, "font-size"],
		[tokens.typography.lineHeight, "font-line-height"],
		[tokens.typography.fontWeight, "font-weight"],
		[tokens.spacing.scale, "space"],
		[tokens.sizing.scale, "size"],
		[tokens.layout.width.scale, "layout-width"],
		[tokens.radius.scale, "radius"],
		[tokens.border.width, "border-width"],
		[tokens.opacity.scale, "opacity"],
		[tokens.icon.stroke.scale, "icon-stroke"],
	] as const;
	for (const [scale, prefix] of scales) {
		for (const [name, value] of Object.entries(scale)) {
			output[`--${prefix}-${name}`] = value;
		}
	}
	for (const [role, values] of Object.entries(tokens.typography.role)) {
		for (const property of ["fontSize", "lineHeight", "fontWeight"] as const) {
			const suffix = property.replace(
				/[A-Z]/g,
				(letter) => `-${letter.toLowerCase()}`,
			);
			output[`--text-${role.replaceAll(".", "-")}-${suffix}`] = variable(
				values[property],
			);
		}
	}

	for (const [name, reference] of Object.entries(tokens.opacity.role)) {
		output[`--opacity-${name}`] = variable(reference);
	}
	for (const [name, reference] of Object.entries(tokens.radius.role)) {
		output[`--radius-${name}`] = variable(reference);
	}
	for (const [name, reference] of Object.entries(tokens.icon.stroke.role)) {
		output[`--icon-stroke-${name}`] = variable(reference);
	}
	for (const [name, reference] of Object.entries(tokens.icon.size)) {
		output[`--icon-size-${name}`] = variable(reference);
	}
	for (const [name, reference] of Object.entries(tokens.icon.role)) {
		output[`--icon-${name.replaceAll(".", "-")}`] = variable(
			`icon.size.${reference}`,
		);
	}
	for (const [name, reference] of Object.entries(tokens.sizing.role)) {
		output[`--size-${name.replaceAll(".", "-")}`] = variable(reference);
	}
	for (const [name, reference] of Object.entries(tokens.layout.width.role)) {
		output[`--layout-width-${name.replaceAll(".", "-")}`] = variable(reference);
	}
	const spacingScale: Record<string, string> = tokens.spacing.scale;
	const spaceValue = (reference: string) => {
		const value = spacingScale[reference.replace("space.", "")];
		if (typeof value !== "string")
			throw new Error(`Unknown spacing reference: ${reference}`);
		return Number.parseFloat(value);
	};
	for (const [density, roles] of Object.entries(tokens.spacing.density)) {
		for (const role of [
			"content.gap",
			"control.gap",
			"control.padding.block",
			"control.padding.inline",
		] as const) {
			const baseline = spaceValue(tokens.spacing.density.default[role]);
			output[`--density-${density}-${role.replaceAll(".", "-")}-scale`] =
				baseline === 0 ? 1 : spaceValue(roles[role]) / baseline;
		}
	}

	for (const [density, roles] of Object.entries(tokens.spacing.density)) {
		for (const [name, reference] of Object.entries(roles)) {
			output[`--space-${density}-${name.replaceAll(".", "-")}`] =
				variable(reference);
		}
	}
	for (const [name, duration] of Object.entries(tokens.motion.duration)) {
		output[`--duration-${name}`] = `${duration.value}${duration.unit}`;
	}
	for (const [name, easing] of Object.entries(tokens.motion.easing)) {
		output[`--easing-${name}`] = `cubic-bezier(${easing.join(", ")})`;
	}
	for (const [name, shadow] of Object.entries(tokens.elevation.shadow)) {
		output[`--shadow-${name}`] = [
			shadow.offsetX,
			shadow.offsetY,
			shadow.blur,
			shadow.spread,
			shadow.color,
		].join(" ");
	}

	const button = tokens.component.button;
	for (const [name, size] of Object.entries(button.size)) {
		output[`--button-height-${name}`] = variable(`size.control.${name}`);
		output[`--button-gap-${name}`] = variable(size.gap);
		output[`--button-padding-block-${name}`] = variable(size.paddingBlock);
		output[`--button-padding-inline-${name}`] = variable(size.paddingInline);
		output[`--button-font-size-${name}`] = variable(size.fontSize);
		output[`--button-line-height-${name}`] = variable(size.lineHeight);
		output[`--button-font-weight-${name}`] = variable(size.fontWeight);
		output[`--button-icon-size-${name}`] = variable(`icon.control.${name}`);
	}
	const buttonAppearances = {
		...semanticButtonAppearances,
		secondary: button.appearance.secondary,
	};
	for (const [name, states] of Object.entries(buttonAppearances)) {
		for (const state of ["default", "hover"] as const) {
			const appearance = states[state];
			const prefix = `--button-${name}${state === "hover" ? "-hover" : ""}`;
			for (const property of ["background", "foreground", "border"] as const) {
				const reference = appearance[property];
				output[`${prefix}-${property}`] =
					reference === "transparent"
						? "transparent"
						: variable(`color.${reference}`);
			}
		}
	}
	output["--button-focus-color"] = variable(`color.${tokens.focus.color}`);
	output["--button-focus-width"] = variable(tokens.focus.width);
	output["--button-focus-offset"] = variable(tokens.focus.offset);

	output["--alert-dialog-default-icon-foreground"] = variable(
		"color.feedback.info.foreground",
	);
	output["--alert-dialog-warning-icon-foreground"] = variable(
		"color.feedback.warning.foreground",
	);
	output["--alert-dialog-destructive-icon-foreground"] = variable(
		"color.feedback.danger.foreground",
	);

	const input = tokens.component.input;
	for (const [name, size] of Object.entries(input.size)) {
		output[`--input-height-${name}`] = variable(`size.control.${name}`);
		output[`--input-gap-${name}`] = variable(size.gap);
		output[`--input-padding-inline-${name}`] = variable(size.paddingInline);
		output[`--input-font-size-${name}`] = variable(size.fontSize);
		output[`--input-line-height-${name}`] = variable(size.lineHeight);
		output[`--input-font-weight-${name}`] = variable(size.fontWeight);
		output[`--input-icon-size-${name}`] = variable(`icon.control.${name}`);
	}
	output["--input-background"] = variable("color.background.component");
	output["--input-border"] = variable("color.border.control");
	output["--input-border-hover"] = variable("color.border.hover");
	output["--input-border-focus"] = variable("color.border.focus");
	output["--input-border-invalid"] = variable("color.action.destructive");
	output["--input-focus-width"] = variable(tokens.focus.width);

	output["--card-background"] = variable("color.background.component");
	output["--card-border"] = variable("color.border.component");
	output["--card-shadow"] = variable(
		tokens.elevation.role["component.surface"],
	);
	for (const text of ["title", "description"] as const) {
		const textTokens = tokens.typography.role[`card.${text}`];
		for (const property of ["fontSize", "lineHeight", "fontWeight"] as const) {
			output[
				`--card-${text}-${property.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`)}`
			] = variable(textTokens[property]);
		}
	}

	output["--dialog-background"] = variable("color.background.component");
	output["--dialog-border"] = variable("color.border.component");
	output["--dialog-overlay-background"] = variable("color.background.overlay");
	output["--dialog-radius"] = variable("radius.overlay");
	output["--dialog-close-size"] = variable("size.dialog.close");
	output["--dialog-shadow"] = variable(
		tokens.elevation.role["component.overlay"],
	);
	for (const size of ["sm", "md", "lg"] as const) {
		output[`--dialog-max-width-${size}`] = variable(
			`layout.width.overlay.${size}`,
		);
	}
	output["--dialog-max-width"] = variable("dialog.max-width-md");
	for (const text of ["title", "description"] as const) {
		const textTokens = tokens.typography.role[`overlay.${text}`];
		for (const property of ["fontSize", "lineHeight", "fontWeight"] as const) {
			output[
				`--dialog-${text}-${property.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`)}`
			] = variable(textTokens[property]);
		}
	}

	output["--drawer-background"] = variable("color.background.component");
	output["--drawer-border"] = variable("color.border.component");
	output["--drawer-overlay-background"] = variable("color.background.overlay");
	output["--drawer-radius"] = variable("radius.overlay");
	output["--drawer-shadow"] = variable(
		tokens.elevation.role["component.overlay"],
	);
	output["--drawer-close-size"] = variable("size.control.close");
	for (const size of ["sm", "md", "lg"] as const) {
		output[`--drawer-extent-${size}`] = variable(
			`layout.width.overlay.${size}`,
		);
	}
	output["--drawer-extent"] = variable("drawer.extent-md");
	for (const text of ["title", "description"] as const) {
		const textTokens = tokens.typography.role[`overlay.${text}`];
		for (const property of ["fontSize", "lineHeight", "fontWeight"] as const) {
			output[
				`--drawer-${text}-${property.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`)}`
			] = variable(textTokens[property]);
		}
	}

	const dropdownMenu = tokens.component.dropdownMenu;
	output["--dropdown-menu-background"] = variable("color.background.component");
	output["--dropdown-menu-border"] = variable("color.border.component");
	output["--dropdown-menu-focus-background"] = variable(
		"color.state.hover.background",
	);
	for (const property of ["padding", "itemGap", "itemPaddingInline"] as const) {
		output[
			`--dropdown-menu-${property.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`)}`
		] = variable(dropdownMenu[property]);
	}
	output["--dropdown-menu-separator-margin-block"] = variable(
		dropdownMenu.padding,
	);
	output["--dropdown-menu-item-height"] = variable("size.menu.item");
	output["--dropdown-menu-min-width"] = variable("layout.width.menu.min");
	output["--dropdown-menu-shadow"] = variable(
		tokens.elevation.role["component.menu"],
	);
	const menuText = tokens.typography.role["menu.item"];
	for (const property of ["fontSize", "lineHeight", "fontWeight"] as const) {
		output[
			`--dropdown-menu-${property.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`)}`
		] = variable(menuText[property]);
	}
	output["--sheet-background"] = variable("color.background.component");
	output["--sheet-border"] = variable("color.border.component");
	output["--sheet-overlay-background"] = variable("color.background.overlay");
	output["--sheet-radius"] = variable("radius.overlay");
	output["--sheet-shadow"] = variable(
		tokens.elevation.role["component.overlay"],
	);
	output["--sheet-close-size"] = variable("size.control.close");
	for (const size of ["sm", "md", "lg"] as const) {
		output[`--sheet-extent-${size}`] = variable(`layout.width.overlay.${size}`);
	}
	output["--sheet-extent"] = variable("sheet.extent-md");
	for (const text of ["title", "description"] as const) {
		const textTokens = tokens.typography.role[`overlay.${text}`];
		for (const property of ["fontSize", "lineHeight", "fontWeight"] as const) {
			output[
				`--sheet-${text}-${property.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`)}`
			] = variable(textTokens[property]);
		}
	}

	const toast = tokens.component.toast;
	output["--toast-background"] = variable("color.background.component");
	output["--toast-border"] = variable("color.border.component");
	for (const property of ["padding", "gap"] as const) {
		output[
			`--toast-${property.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`)}`
		] = variable(toast[property]);
	}
	output["--toast-max-width"] = variable("layout.width.overlay.sm");
	output["--toast-shadow"] = variable(
		tokens.elevation.role["component.overlay"],
	);
	output["--toast-close-size"] = variable("size.control.close");
	for (const text of ["title", "description"] as const) {
		const textTokens =
			text === "description"
				? tokens.typography.role["body.small"]
				: tokens.typography.role["toast.title"];
		for (const property of ["fontSize", "lineHeight", "fontWeight"] as const) {
			output[
				`--toast-${text}-${property.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`)}`
			] = variable(textTokens[property]);
		}
	}
	output["--toast-default-icon-foreground"] = variable(
		"color.feedback.default.foreground",
	);
	output["--toast-info-icon-foreground"] = variable(
		"color.feedback.info.foreground",
	);
	output["--toast-success-icon-foreground"] = variable(
		"color.feedback.success.foreground",
	);
	output["--toast-warning-icon-foreground"] = variable(
		"color.feedback.warning.foreground",
	);
	output["--toast-destructive-icon-foreground"] = variable(
		"color.feedback.danger.foreground",
	);
	output["--pagination-item-size"] = variable("size.control.md");
	output["--pagination-item-size-sm"] = variable("size.control.sm");

	const table = tokens.component.table;
	output["--table-header-background"] = variable(
		`color.${table.headerBackground}`,
	);
	output["--table-row-hover-background"] = variable(
		"color.state.hover.background",
	);
	for (const property of [
		"cellPaddingBlock",
		"cellPaddingInline",
		"compactCellPaddingBlock",
		"compactCellPaddingInline",
		"cardHeaderPaddingBlock",
		"cardHeaderPaddingInline",
		"compactCardHeaderPaddingBlock",
		"compactCardHeaderPaddingInline",
		"cardHeaderGap",
	] as const) {
		output[
			`--table-${property.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`)}`
		] = variable(table[property]);
	}
	output["--table-shadow"] = variable(
		tokens.elevation.role["component.surface"],
	);
	for (const text of ["header", "body"] as const) {
		const role = tokens.typography.role[`table.${text}`];
		for (const property of ["fontSize", "lineHeight", "fontWeight"] as const) {
			output[
				`--table-${text}-${property.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`)}`
			] = variable(role[property]);
		}
	}
	for (const text of ["cardTitle", "cardDescription"] as const) {
		const roleName = text.replace(
			/[A-Z]/g,
			(letter) => `-${letter.toLowerCase()}`,
		) as "card-title" | "card-description";
		const role = tokens.typography.role[`table.${roleName}`];
		for (const property of ["fontSize", "lineHeight", "fontWeight"] as const) {
			output[
				`--table-${text.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`)}-${property.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`)}`
			] = variable(role[property]);
		}
	}
	return output;
}

function block(selector: string, variables: Variables) {
	const declarations = Object.entries(variables).map(
		([name, value]) => `  ${name}: ${value};`,
	);
	return `${selector} {\n${declarations.join("\n")}\n}`;
}

export function serializeThemeCss(tokens: KitTokens): string {
	const light = getVariables(tokens, "light");
	const dark = getVariables(tokens, "dark");
	return [
		"/* Generated from tokens/*.ts. Regenerate this file instead of editing it directly. */",
		block(':root, [data-theme="light"]', light),
		block('[data-theme="dark"]', dark),
		"",
	].join("\n\n");
}

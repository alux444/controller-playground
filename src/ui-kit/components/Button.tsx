import type { ComponentPropsWithRef, ReactElement, ReactNode } from "react";
import "./button.css";

export type ButtonVariant = "primary" | "secondary" | "destructive" | "quiet";
export type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps extends ComponentPropsWithRef<"button"> {
	variant?: ButtonVariant;
	size?: ButtonSize;
	leadingIcon?: ReactNode;
	trailingIcon?: ReactNode;
	loading?: boolean;
}

export interface IconButtonProps
	extends Omit<
		ButtonProps,
		"aria-label" | "children" | "leadingIcon" | "trailingIcon"
	> {
	"aria-label": string;
	icon: ReactNode;
}

export function Button({
	ref,
	children,
	className,
	disabled,
	leadingIcon,
	loading = false,
	size = "md",
	trailingIcon,
	variant = "primary",
	type = "button",
	...props
}: ButtonProps): ReactElement {
	const hasChildren =
		children !== null &&
		children !== undefined &&
		typeof children !== "boolean";
	const iconOnly = !hasChildren && Boolean(leadingIcon) && !trailingIcon;
	return (
		<button
			ref={ref}
			type={type}
			aria-busy={loading || undefined}
			className={["ui-button", className].filter(Boolean).join(" ")}
			data-icon-only={iconOnly || undefined}
			data-loading={loading || undefined}
			data-size={size}
			data-variant={variant}
			disabled={disabled || loading}
			{...props}
		>
			{loading ? (
				<svg
					aria-hidden="true"
					className="ui-button__spinner"
					viewBox="0 0 24 24"
				>
					<circle cx="12" cy="12" r="9" />
					<path d="M21 12a9 9 0 0 0-9-9" />
				</svg>
			) : null}
			{leadingIcon ? (
				<span aria-hidden="true" className="ui-button__icon">
					{leadingIcon}
				</span>
			) : null}
			{hasChildren ? (
				<span className="ui-button__label">{children}</span>
			) : null}
			{!iconOnly && trailingIcon ? (
				<span aria-hidden="true" className="ui-button__icon">
					{trailingIcon}
				</span>
			) : null}
		</button>
	);
}

export function IconButton({
	ref,
	icon,
	...props
}: IconButtonProps): ReactElement {
	return <Button {...props} ref={ref} leadingIcon={icon} />;
}

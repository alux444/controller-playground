export interface ControllerState {
  mode: "wheel" | "gamepad";
  x: number;
  y: number;
  primary: boolean;
  secondary: boolean;
}

export const neutralState: ControllerState = {
  mode: "wheel",
  x: 0,
  y: 0,
  primary: false,
  secondary: false,
};

export function parseControllerState(
  value: unknown,
): ControllerState | undefined {
  if (typeof value !== "object" || value === null) return undefined;
  const state = value as Record<string, unknown>;
  if (state.mode !== "wheel" && state.mode !== "gamepad") return undefined;
  if (
    typeof state.x !== "number" ||
    !Number.isFinite(state.x) ||
    Math.abs(state.x) > 1
  )
    return undefined;
  if (
    typeof state.y !== "number" ||
    !Number.isFinite(state.y) ||
    Math.abs(state.y) > 1
  )
    return undefined;
  if (
    typeof state.primary !== "boolean" ||
    typeof state.secondary !== "boolean"
  )
    return undefined;
  return {
    mode: state.mode,
    x: state.x,
    y: state.y,
    primary: state.primary,
    secondary: state.secondary,
  };
}

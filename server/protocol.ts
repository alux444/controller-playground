export interface ControllerState {
  mode: "wheel" | "gamepad" | "twin-stick" | "motion-pointer";
  x: number;
  y: number;
  aimX: number;
  aimY: number;
  primary: boolean;
  secondary: boolean;
}

export const neutralState: ControllerState = {
  mode: "wheel",
  x: 0,
  y: 0,
  aimX: 0,
  aimY: 0,
  primary: false,
  secondary: false,
};

export function parseControllerState(
  value: unknown,
): ControllerState | undefined {
  if (typeof value !== "object" || value === null) return undefined;
  const state = value as Record<string, unknown>;
  if (
    state.mode !== "wheel" &&
    state.mode !== "gamepad" &&
    state.mode !== "twin-stick" &&
    state.mode !== "motion-pointer"
  )
    return undefined;
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
  const aimX = state.aimX ?? 0;
  const aimY = state.aimY ?? 0;
  if (typeof aimX !== "number" || !Number.isFinite(aimX) || Math.abs(aimX) > 1)
    return undefined;
  if (typeof aimY !== "number" || !Number.isFinite(aimY) || Math.abs(aimY) > 1)
    return undefined;
  return {
    mode: state.mode,
    x: state.x,
    y: state.y,
    aimX,
    aimY,
    primary: state.primary,
    secondary: state.secondary,
  };
}

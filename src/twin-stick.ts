import type { ControllerState } from "../server/protocol.ts";

type StickSide = "move" | "aim";

export function setStick(
  state: ControllerState,
  side: StickSide,
  x: number,
  y: number,
): void {
  const magnitude = Math.max(1, Math.hypot(x, y));
  if (side === "move") {
    state.x = x / magnitude;
    state.y = y / magnitude;
    return;
  }
  state.aimX = x / magnitude;
  state.aimY = y / magnitude;
}

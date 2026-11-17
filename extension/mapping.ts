import type { ControllerState } from "../server/protocol.ts";

export interface WheelInput {
  connected: boolean;
  steering: number;
  accelerator: boolean;
  brake: boolean;
}

export const neutralWheel: WheelInput = {
  connected: false,
  steering: 0,
  accelerator: false,
  brake: false,
};

export function mapWheel(state: ControllerState): WheelInput {
  if (state.mode !== "wheel") return { ...neutralWheel };
  return {
    connected: true,
    steering: state.x,
    accelerator: state.primary,
    brake: state.secondary,
  };
}

export function createGamepad(input: WheelInput, index: number): Gamepad {
  const buttons = Array.from({ length: 17 }, (_, buttonIndex): GamepadButton => {
    const pressed =
      (buttonIndex === 7 && input.accelerator) || (buttonIndex === 6 && input.brake);
    return { pressed, touched: pressed, value: pressed ? 1 : 0 };
  });
  return {
    id: "Phone Wheel (Controller Playground)",
    index,
    connected: input.connected,
    mapping: "standard",
    timestamp: performance.now(),
    axes: [input.steering, 0, 0, 0],
    buttons,
    vibrationActuator: null,
  } as unknown as Gamepad;
}

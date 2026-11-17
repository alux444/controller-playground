import { createGamepad, neutralWheel, type WheelInput } from "./mapping.ts";

const nativeGetGamepads = navigator.getGamepads.bind(navigator);
let wheel: WheelInput = { ...neutralWheel };
let lastIndex: number | undefined;
let lastUpdate = 0;

function getGamepads(): (Gamepad | null)[] {
  const pads = Array.from(nativeGetGamepads());
  if (!wheel.connected) return pads;
  const available = pads.findIndex((pad) => pad === null);
  const index = available === -1 ? pads.length : available;
  lastIndex = index;
  pads[index] = createGamepad(wheel, index);
  return pads;
}

function announce(
  type: "gamepadconnected" | "gamepaddisconnected",
  input: WheelInput,
  index: number,
): void {
  const event = new Event(type);
  Object.defineProperty(event, "gamepad", { value: createGamepad(input, index) });
  window.dispatchEvent(event);
}

Object.defineProperty(navigator, "getGamepads", {
  configurable: true,
  value: getGamepads,
});
window.addEventListener("message", (event: MessageEvent<unknown>) => {
  if (event.source !== window || typeof event.data !== "object" || event.data === null)
    return;
  const message = event.data as { source?: string; input?: WheelInput };
  if (message.source !== "controller-playground-phone-wheel" || !message.input) return;
  const wasConnected = wheel.connected;
  wheel = message.input;
  lastUpdate = Date.now();
  if (!wasConnected && wheel.connected) {
    getGamepads();
    announce("gamepadconnected", wheel, lastIndex ?? 0);
  }
  if (wasConnected && !wheel.connected)
    announce("gamepaddisconnected", wheel, lastIndex ?? 0);
});

window.setInterval(() => {
  if (!wheel.connected || Date.now() - lastUpdate < 1200) return;
  wheel = { ...neutralWheel };
  announce("gamepaddisconnected", wheel, lastIndex ?? 0);
}, 500);

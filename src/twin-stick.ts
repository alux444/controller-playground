import type { ControllerState } from "../server/protocol.ts";
import { element } from "./dom.ts";

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

function bindStick(
  state: ControllerState,
  side: StickSide,
  transmit: () => void,
  padId: string,
  mode: "gamepad" | "twin-stick",
): () => void {
  const pad = element<HTMLElement>(`#${padId}`);
  const knob = element<HTMLElement>(".stick-knob", pad);
  let activePointer: number | undefined;
  const pressed = new Set<string>();

  function update(event: PointerEvent): void {
    if (state.mode !== mode || event.pointerId !== activePointer) return;
    const bounds = pad.getBoundingClientRect();
    const x =
      (event.clientX - bounds.left - bounds.width / 2) / (bounds.width / 2);
    const y =
      (event.clientY - bounds.top - bounds.height / 2) / (bounds.height / 2);
    setStick(state, side, x, y);
    const offsetX = side === "move" ? state.x : state.aimX;
    const offsetY = side === "move" ? state.y : state.aimY;
    const distance = Math.max(0, (bounds.width - knob.offsetWidth) / 2);
    knob.style.transform = `translate(${offsetX * distance}px, ${offsetY * distance}px)`;
    transmit();
  }

  function reset(): void {
    const pointer = activePointer;
    activePointer = undefined;
    if (pointer !== undefined && pad.hasPointerCapture(pointer))
      pad.releasePointerCapture(pointer);
    pressed.clear();
    setStick(state, side, 0, 0);
    knob.style.transform = "translate(0, 0)";
    transmit();
  }

  function release(event: PointerEvent): void {
    if (event.pointerId !== activePointer) return;
    reset();
  }

  function keyboard(event: KeyboardEvent, down: boolean): void {
    if (
      state.mode !== mode ||
      !["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(event.key)
    )
      return;
    event.preventDefault();
    if (down) pressed.add(event.key);
    else pressed.delete(event.key);
    const x =
      Number(pressed.has("ArrowRight")) - Number(pressed.has("ArrowLeft"));
    const y = Number(pressed.has("ArrowDown")) - Number(pressed.has("ArrowUp"));
    setStick(state, side, x, y);
    knob.style.transform = `translate(${x * 28}px, ${y * 28}px)`;
    transmit();
  }

  pad.addEventListener("pointerdown", (event) => {
    if (state.mode !== mode || activePointer !== undefined) return;
    event.preventDefault();
    activePointer = event.pointerId;
    pad.setPointerCapture(event.pointerId);
    update(event);
  });
  pad.addEventListener("pointermove", update);
  pad.addEventListener("pointerup", release);
  pad.addEventListener("pointercancel", release);
  pad.addEventListener("lostpointercapture", release);
  pad.addEventListener("keydown", (event) => keyboard(event, true));
  pad.addEventListener("keyup", (event) => keyboard(event, false));
  pad.addEventListener("blur", reset);
  return reset;
}

export function bindTwinSticks(
  state: ControllerState,
  transmit: () => void,
): () => void {
  const resetMove = bindStick(
    state,
    "move",
    transmit,
    "move-stick",
    "twin-stick",
  );
  const resetAim = bindStick(state, "aim", transmit, "aim-stick", "twin-stick");
  return () => {
    resetMove();
    resetAim();
  };
}

export function bindGamepadStick(
  state: ControllerState,
  transmit: () => void,
): () => void {
  return bindStick(state, "move", transmit, "stick", "gamepad");
}

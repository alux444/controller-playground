import type { ControllerState } from "../server/protocol.ts";
import { element } from "./dom.ts";
import { pointerAim, type Orientation } from "./motion-math.ts";

interface MotionPermission {
  requestPermission?: () => Promise<"granted" | "denied">;
}

interface PointerDependencies {
  state: ControllerState;
  portrait: MediaQueryList;
  suspended: () => boolean;
  transmit: () => void;
}

export function bindMotionPointer({
  state,
  portrait,
  suspended,
  transmit,
}: PointerDependencies): () => void {
  const indicator = element<HTMLElement>("#pointer-dot");
  const instruction = element<HTMLElement>("#pointer-instruction");
  const enable = element<HTMLButtonElement>("#pointer-enable");
  const horizontal = element<HTMLInputElement>("#pointer-x");
  const vertical = element<HTMLInputElement>("#pointer-y");
  const sensitivity = element<HTMLInputElement>("#pointer-sensitivity");
  const centerButton = element<HTMLButtonElement>("#pointer-recenter");
  const landscape = window.matchMedia(
    "(orientation: landscape) and (pointer: coarse)",
  );
  let current: Orientation | undefined;
  let center: Orientation | undefined;
  let enabled = false;

  function render(): void {
    indicator.style.left = `${50 + state.aimX * 42}%`;
    indicator.style.top = `${50 + state.aimY * 40}%`;
    horizontal.value = String(Math.round(state.aimX * 100));
    vertical.value = String(Math.round(state.aimY * 100));
    transmit();
  }

  function reset(): void {
    center = undefined;
    current = undefined;
    state.aimX = 0;
    state.aimY = 0;
    centerButton.textContent = "Set centre";
    if (enabled && state.mode === "motion-pointer") {
      instruction.textContent =
        "Point the top of your phone at the centre of the screen, then tap Set centre.";
    }
    render();
  }

  function useTouch(): void {
    enabled = false;
    enable.textContent = "Enable motion";
    instruction.textContent = "Use the sliders to aim, or enable motion.";
    state.aimX = Number(horizontal.value) / 100;
    state.aimY = Number(vertical.value) / 100;
    render();
  }

  function updateAim(): void {
    if (!center || !current) return;
    const point = pointerAim(center, current, Number(sensitivity.value) / 100);
    state.aimX = point.x;
    state.aimY = point.y;
    render();
  }

  horizontal.addEventListener("input", useTouch);
  vertical.addEventListener("input", useTouch);
  sensitivity.addEventListener("input", () => {
    element<HTMLOutputElement>("#pointer-sensitivity-value").textContent =
      `${sensitivity.value}%`;
    if (enabled && !suspended()) updateAim();
  });
  centerButton.addEventListener("click", () => {
    if (!enabled || !current) {
      instruction.textContent =
        "Enable motion first, then point at the centre of the screen.";
      return;
    }
    center = current;
    state.aimX = 0;
    state.aimY = 0;
    centerButton.textContent = "Recenter";
    instruction.textContent =
      "Point the top of your phone to aim. Tap Recenter to set a new centre.";
    render();
  });
  enable.addEventListener("click", async () => {
    try {
      if (
        !window.isSecureContext ||
        typeof DeviceOrientationEvent === "undefined"
      )
        throw new Error("unavailable");
      const orientation = DeviceOrientationEvent as unknown as MotionPermission;
      if (
        typeof orientation.requestPermission === "function" &&
        (await orientation.requestPermission()) !== "granted"
      )
        throw new Error("denied");
      enabled = true;
      reset();
      instruction.textContent = "Waiting for motion…";
      enable.textContent = "Waiting for motion…";
      setTimeout(() => {
        if (!enabled || current !== undefined) return;
        instruction.textContent = "Motion unavailable. Use the sliders to aim.";
        enable.textContent = "Try motion again";
      }, 3000);
    } catch {
      instruction.textContent = "Motion unavailable. Use the sliders to aim.";
    }
  });
  window.addEventListener("deviceorientation", (event) => {
    if (
      !enabled ||
      state.mode !== "motion-pointer" ||
      document.hidden ||
      suspended() ||
      landscape.matches
    )
      return;
    if (
      event.alpha === null ||
      event.beta === null ||
      event.gamma === null ||
      !Number.isFinite(event.alpha) ||
      !Number.isFinite(event.beta) ||
      !Number.isFinite(event.gamma)
    )
      return;
    const firstReading = current === undefined;
    current = { alpha: event.alpha, beta: event.beta, gamma: event.gamma };
    if (firstReading && !center) {
      instruction.textContent =
        "Point the top of your phone at the centre of the screen, then tap Set centre.";
      enable.textContent = "Motion enabled ✓";
    }
    updateAim();
  });
  portrait.addEventListener("change", reset);
  screen.orientation?.addEventListener("change", reset);
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) reset();
  });
  return reset;
}

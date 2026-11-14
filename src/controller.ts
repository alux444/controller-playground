import type { ControllerState } from "../server/protocol.ts";
import { element, socketUrl } from "./dom.ts";
import { steeringAngle, steeringInput } from "./steering.ts";
import { bindGamepadStick, bindTwinSticks } from "./twin-stick.ts";
import { bindMotionPointer } from "./motion-pointer.ts";

interface MotionEventConstructor {
  requestPermission?: () => Promise<"granted" | "denied">;
}

export function showController(app: HTMLElement, room: string): void {
  app.innerHTML = `
    <main class="phone-shell" data-mode="wheel">
      <header class="phone-header"><div class="phone-identity"><span class="phone-logo">Controller</span><span class="phone-status" id="phone-status" aria-live="polite">Connecting…</span></div><div class="phone-header-actions"><button type="button" id="fullscreen" hidden>Full screen</button><button type="button" id="open-settings">Settings</button></div></header>
      <dialog class="settings-dialog" id="settings-dialog" aria-labelledby="settings-title"><div class="settings-head"><h1 id="settings-title">Controller settings</h1><button type="button" id="close-settings">Done</button></div><p class="settings-status" id="settings-status" aria-live="polite">Connecting…</p>
      <div class="configuration"><div class="player-picker"><span>Choose player</span><div role="group" aria-label="Player"><button type="button" data-slot="1" aria-pressed="false">Player 1</button><button type="button" data-slot="2" aria-pressed="false">Player 2</button></div></div>
      <nav class="mode-switch" id="mode-switch" aria-label="Controller type" inert><button type="button" data-mode="wheel" aria-pressed="true">Wheel</button><button type="button" data-mode="gamepad" aria-pressed="false">Gamepad</button><button type="button" data-mode="twin-stick" aria-pressed="false">Twin sticks</button><button type="button" data-mode="motion-pointer" aria-pressed="false">Pointer</button></nav></div>
      <section class="control-settings" id="wheel-settings"><label class="slider-label" for="sensitivity">Steering sensitivity <output id="sensitivity-value" for="sensitivity">100%</output></label><input id="sensitivity" type="range" min="70" max="200" step="10" value="100"></section>
      <section class="control-settings" id="pointer-settings" hidden><label class="slider-label" for="pointer-sensitivity">Pointer sensitivity <output id="pointer-sensitivity-value" for="pointer-sensitivity">100%</output></label><input id="pointer-sensitivity" type="range" min="50" max="200" step="10" value="100"></section>
      </dialog>
      <div class="rotate-prompt rotate-landscape" role="status"><div class="rotate-icon" aria-hidden="true">↻</div><h2>Turn your phone sideways</h2><p>Use this controller in landscape, or choose Pointer to aim upright.</p></div>
      <div class="rotate-prompt rotate-portrait" role="status"><div class="rotate-icon" aria-hidden="true">↻</div><h2>Turn your screen to portrait</h2><p>Hold the phone like a remote, with its top edge pointing at the screen.</p></div>
      <section class="controller" id="controller" inert>
        <div class="controller-head"><span id="controller-label">Wheel</span><span>Live input <span class="live-dot">●</span></span></div>
        <div id="wheel-controls">
          <div class="wheel-stage"><div class="phone-wheel" id="phone-wheel"><span></span><span></span><span></span><b>●</b></div></div>
          <p class="instruction" id="motion-instruction">Enable motion, then hold your phone like a wheel.</p>
          <div class="motion-actions"><button class="pill bright" id="motion" type="button">Enable motion</button><button class="pill subtle" id="recenter" type="button">Recenter</button></div><label class="slider-label" for="steering">Touch steering <span>← &nbsp; →</span></label><input id="steering" type="range" min="-100" max="100" value="0">
        </div>
        <div id="gamepad-controls" hidden><div class="stick-stage"><div class="stick" id="stick" role="application" tabindex="0" aria-label="Joystick. Use arrow keys or touch."><span id="stick-knob" class="stick-knob"></span></div></div></div>
        <div id="twin-stick-controls" hidden><div class="twin-pad"><div class="stick" id="move-stick" role="application" tabindex="0" aria-label="Move stick. Use arrow keys or touch."><span class="stick-knob"></span></div><span>Move</span></div><div class="twin-pad"><div class="stick" id="aim-stick" role="application" tabindex="0" aria-label="Aim stick. Use arrow keys or touch."><span class="stick-knob"></span></div><span>Aim</span></div></div>
        <div id="pointer-controls" hidden><div class="pointer-preview" aria-hidden="true"><span id="pointer-dot"></span></div><div class="pointer-settings"><p class="instruction" id="pointer-instruction">Hold your phone like a remote, with its top edge pointing at the screen. Enable motion to begin.</p><div class="motion-actions"><button class="pill bright" id="pointer-enable" type="button">Enable motion</button><button class="pill subtle" id="pointer-recenter" type="button">Set centre</button></div><details><summary>Touch aiming</summary><label class="slider-label" for="pointer-x">Left / right</label><input id="pointer-x" type="range" min="-100" max="100" value="0"><label class="slider-label" for="pointer-y">Up / down</label><input id="pointer-y" type="range" min="-100" max="100" value="0"></details></div></div>
        <div class="actions"><button type="button" data-action="secondary"><span>B</span><small id="secondary-label">Brake</small></button><button type="button" data-action="primary"><span>A</span><small id="primary-label">Accelerate</small></button></div>
      </section>
    </main>`;
  let socket = new WebSocket(socketUrl("player", room));
  const state: ControllerState = {
    mode: "wheel",
    x: 0,
    y: 0,
    aimX: 0,
    aimY: 0,
    primary: false,
    secondary: false,
  };
  const phoneStatus = element<HTMLElement>("#phone-status");
  const settingsStatus = element<HTMLElement>("#settings-status");
  const settings = element<HTMLDialogElement>("#settings-dialog");
  const wheel = element<HTMLElement>("#phone-wheel");
  const slider = element<HTMLInputElement>("#steering");
  const portrait = window.matchMedia(
    "(orientation: portrait) and (pointer: coarse)",
  );
  let selectedSlot: number | undefined;
  let reconnectSlot: number | undefined;
  let takenSlots: number[] = [];
  let lobbyConnected = false;
  let resetTwinSticks = (): void => {};
  let resetGamepadStick = (): void => {};
  let resetMotionPointer = (): void => {};

  function updatePlayerChoices(): void {
    document
      .querySelectorAll<HTMLButtonElement>("[data-slot]")
      .forEach((button) => {
        const slot = Number(button.dataset.slot);
        const selected = slot === selectedSlot;
        const occupied = !selected && takenSlots.includes(slot);
        button.disabled = !lobbyConnected || occupied;
        button.setAttribute("aria-pressed", String(selected));
        button.textContent = `Player ${slot}${occupied ? " · Taken" : ""}`;
      });
    element<HTMLElement>("#mode-switch").inert = selectedSlot === undefined;
    element<HTMLElement>("#controller").inert = selectedSlot === undefined;
    element<HTMLButtonElement>("#close-settings").disabled =
      selectedSlot === undefined;
  }

  function render(): void {
    wheel.style.transform = `rotate(${state.x * 90}deg)`;
    slider.value = String(Math.round(state.x * 100));
  }

  function transmit(): void {
    if (selectedSlot !== undefined && socket.readyState === WebSocket.OPEN)
      socket.send(JSON.stringify(state));
  }

  function neutral(): void {
    state.x = 0;
    state.y = 0;
    state.aimX = 0;
    state.aimY = 0;
    state.primary = false;
    state.secondary = false;
    resetGamepadStick();
    resetTwinSticks();
    resetMotionPointer();
    document
      .querySelectorAll(".pressed")
      .forEach((button) => button.classList.remove("pressed"));
    element<HTMLElement>("#stick-knob").style.transform = "translate(0, 0)";
    render();
    transmit();
  }

  function pauseForSettings(): void {
    state.x = 0;
    state.y = 0;
    state.aimX = 0;
    state.aimY = 0;
    state.primary = false;
    state.secondary = false;
    resetGamepadStick();
    resetTwinSticks();
    document
      .querySelectorAll(".pressed")
      .forEach((button) => button.classList.remove("pressed"));
    render();
    transmit();
  }

  function updateStatus(message: string, connected: boolean = false): void {
    phoneStatus.textContent = message;
    settingsStatus.textContent = message;
    phoneStatus.classList.toggle("connected", connected);
  }

  function connect(): void {
    socket.addEventListener("message", (event: MessageEvent<string>) => {
      const message = JSON.parse(event.data) as {
        type: string;
        slot?: number;
        taken?: number[];
      };
      if (message.type === "lobby") {
        lobbyConnected = true;
        updatePlayerChoices();
        if (reconnectSlot !== undefined) {
          socket.send(JSON.stringify({ type: "select", slot: reconnectSlot }));
          return;
        }
        updateStatus("Choose a player");
      }
      if (message.type === "joined") {
        selectedSlot = message.slot;
        reconnectSlot = undefined;
        updateStatus(`P${selectedSlot} connected`, true);
        updatePlayerChoices();
        transmit();
      }
      if (message.type === "slots") {
        takenSlots = message.taken ?? [];
        updatePlayerChoices();
      }
      if (message.type === "slot-taken") {
        reconnectSlot = undefined;
        updateStatus(`Player ${message.slot} is taken`);
      }
    });
    socket.addEventListener("close", (event) => {
      neutral();
      reconnectSlot = selectedSlot;
      selectedSlot = undefined;
      takenSlots = [];
      lobbyConnected = false;
      updatePlayerChoices();
      if (event.code === 1008) {
        updateStatus("Session full or unavailable · Scan again");
        return;
      }
      if (event.code === 1000) {
        updateStatus("Session ended · Scan again");
        return;
      }
      updateStatus("Reconnecting…");
      setTimeout(() => {
        socket = new WebSocket(socketUrl("player", room));
        connect();
      }, 1500);
    });
  }
  updatePlayerChoices();
  connect();
  document
    .querySelectorAll<HTMLButtonElement>("[data-slot]")
    .forEach((button) => {
      button.addEventListener("click", () => {
        if (socket.readyState !== WebSocket.OPEN) return;
        neutral();
        socket.send(
          JSON.stringify({ type: "select", slot: Number(button.dataset.slot) }),
        );
      });
    });
  setInterval(transmit, 150);
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) neutral();
  });
  portrait.addEventListener("change", neutral);

  element<HTMLButtonElement>("#open-settings").addEventListener("click", () => {
    pauseForSettings();
    if (!settings.open) settings.showModal();
  });
  element<HTMLButtonElement>("#close-settings").addEventListener("click", () =>
    settings.close(),
  );
  settings.addEventListener("cancel", (event: Event) => {
    if (selectedSlot === undefined) event.preventDefault();
  });

  const fullscreen = element<HTMLButtonElement>("#fullscreen");
  fullscreen.hidden = !document.fullscreenEnabled;
  fullscreen.addEventListener("click", async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await document.documentElement.requestFullscreen();
    } catch {
      updateStatus(
        "Full screen is unavailable in this browser",
        selectedSlot !== undefined,
      );
    }
  });
  document.addEventListener("fullscreenchange", () => {
    fullscreen.textContent = document.fullscreenElement
      ? "Exit full screen"
      : "Full screen";
  });

  const context: ControllerContext = {
    state,
    neutral,
    portrait,
    render,
    suspended: () => settings.open,
    transmit,
  };
  bindModes(context);
  bindActionButtons(context);
  bindMotion(context);
  resetGamepadStick = bindGamepadStick(state, transmit);
  resetTwinSticks = bindTwinSticks(state, transmit);
  resetMotionPointer = bindMotionPointer({
    state,
    portrait,
    suspended: () => settings.open,
    transmit,
  });
  settings.showModal();
}

interface ControllerContext {
  state: ControllerState;
  neutral: () => void;
  portrait: MediaQueryList;
  render: () => void;
  suspended: () => boolean;
  transmit: () => void;
}

function bindModes({ state, neutral, transmit }: ControllerContext): void {
  document
    .querySelectorAll<HTMLButtonElement>("button[data-mode]")
    .forEach((button) =>
      button.addEventListener("click", () => {
        neutral();
        const mode = button.dataset.mode;
        if (
          mode !== "wheel" &&
          mode !== "gamepad" &&
          mode !== "twin-stick" &&
          mode !== "motion-pointer"
        )
          return;
        state.mode = mode;
        element<HTMLElement>(".phone-shell").dataset.mode = mode;
        document
          .querySelectorAll<HTMLButtonElement>("button[data-mode]")
          .forEach((item) =>
            item.setAttribute("aria-pressed", String(item === button)),
          );
        element<HTMLElement>("#wheel-controls").hidden = state.mode !== "wheel";
        element<HTMLElement>("#gamepad-controls").hidden =
          state.mode !== "gamepad";
        element<HTMLElement>("#twin-stick-controls").hidden =
          state.mode !== "twin-stick";
        element<HTMLElement>("#pointer-controls").hidden =
          state.mode !== "motion-pointer";
        element<HTMLElement>("#wheel-settings").hidden = state.mode !== "wheel";
        element<HTMLElement>("#pointer-settings").hidden =
          state.mode !== "motion-pointer";
        element<HTMLElement>("#controller-label").textContent =
          state.mode === "wheel"
            ? "Wheel"
            : state.mode === "gamepad"
              ? "Gamepad"
              : state.mode === "twin-stick"
                ? "Twin sticks"
                : "Motion pointer";
        element<HTMLElement>("#primary-label").textContent =
          state.mode === "wheel"
            ? "Accelerate"
            : state.mode === "twin-stick" || state.mode === "motion-pointer"
              ? "Fire"
              : "Action A";
        element<HTMLElement>("#secondary-label").textContent =
          state.mode === "wheel" ? "Brake" : "Action B";
        transmit();
      }),
    );
}

function bindActionButtons({ state, transmit }: ControllerContext): void {
  document
    .querySelectorAll<HTMLButtonElement>("[data-action]")
    .forEach((button) => {
      function setPressed(pressed: boolean): void {
        if (button.dataset.action === "primary") state.primary = pressed;
        else state.secondary = pressed;
        button.classList.toggle("pressed", pressed);
        transmit();
      }
      button.addEventListener("pointerdown", (event) => {
        event.preventDefault();
        button.setPointerCapture(event.pointerId);
        setPressed(true);
      });
      button.addEventListener("pointerup", () => setPressed(false));
      button.addEventListener("pointercancel", () => setPressed(false));
      button.addEventListener("lostpointercapture", () => setPressed(false));
      button.addEventListener("keydown", (event) => {
        if (event.key === " " || event.key === "Enter") setPressed(true);
      });
      button.addEventListener("keyup", (event) => {
        if (event.key === " " || event.key === "Enter") setPressed(false);
      });
    });
}

function bindMotion({
  state,
  portrait,
  render,
  suspended,
  transmit,
}: ControllerContext): void {
  const slider = element<HTMLInputElement>("#steering");
  const sensitivity = element<HTMLInputElement>("#sensitivity");
  const sensitivityValue = element<HTMLOutputElement>("#sensitivity-value");
  let currentAngle: number | undefined;
  let centerAngle: number | undefined;
  let motionEnabled = false;
  let awaitingUpright = false;

  portrait.addEventListener("change", () => {
    currentAngle = undefined;
    centerAngle = undefined;
  });

  sensitivity.addEventListener("input", () => {
    sensitivityValue.textContent = `${sensitivity.value}%`;
    if (
      !motionEnabled ||
      suspended() ||
      currentAngle === undefined ||
      centerAngle === undefined
    )
      return;
    state.x = steeringInput(
      currentAngle,
      centerAngle,
      Number(sensitivity.value) / 100,
    );
    render();
    transmit();
  });
  slider.addEventListener("input", () => {
    motionEnabled = false;
    element<HTMLButtonElement>("#motion").textContent = "Enable motion";
    state.x = Number(slider.value) / 100;
    render();
    transmit();
  });
  slider.addEventListener("change", () => {
    state.x = 0;
    render();
    transmit();
  });
  element<HTMLButtonElement>("#recenter").addEventListener("click", () => {
    centerAngle = currentAngle;
    state.x = 0;
    render();
    transmit();
  });
  element<HTMLButtonElement>("#motion").addEventListener("click", async () => {
    try {
      const orientation =
        DeviceOrientationEvent as unknown as MotionEventConstructor;
      if (
        typeof orientation.requestPermission === "function" &&
        (await orientation.requestPermission()) !== "granted"
      )
        throw new Error("denied");
      if (!window.isSecureContext) throw new Error("https");
      motionEnabled = true;
      currentAngle = undefined;
      centerAngle = undefined;
      element<HTMLElement>("#motion-instruction").textContent =
        "Waiting for motion… Hold your phone like a wheel.";
      element<HTMLButtonElement>("#motion").textContent = "Waiting for motion…";
      setTimeout(() => {
        if (!motionEnabled || currentAngle !== undefined) return;
        element<HTMLElement>("#motion-instruction").textContent =
          "No motion detected. Check your browser settings, or use touch steering.";
        element<HTMLButtonElement>("#motion").textContent = "Try motion again";
      }, 3000);
    } catch {
      element<HTMLElement>("#motion-instruction").textContent =
        "Motion unavailable. Use touch steering below; motion requires HTTPS and permission.";
    }
  });
  window.addEventListener("deviceorientation", (event) => {
    if (
      !motionEnabled ||
      document.hidden ||
      suspended() ||
      portrait.matches ||
      state.mode !== "wheel" ||
      event.beta === null ||
      event.gamma === null
    )
      return;
    currentAngle = steeringAngle(event.beta, event.gamma);
    if (currentAngle === undefined) {
      awaitingUpright = true;
      state.x = 0;
      element<HTMLElement>("#motion-instruction").textContent =
        "Hold your phone more upright to steer.";
      render();
      transmit();
      return;
    }
    if (awaitingUpright) {
      awaitingUpright = false;
      element<HTMLElement>("#motion-instruction").textContent =
        "Hold your phone like a wheel, then turn it to steer.";
    }
    if (centerAngle === undefined) {
      centerAngle = currentAngle;
      element<HTMLElement>("#motion-instruction").textContent =
        "Hold your phone like a wheel, then turn it to steer.";
      element<HTMLButtonElement>("#motion").textContent = "Motion enabled ✓";
    }
    state.x = steeringInput(
      currentAngle,
      centerAngle,
      Number(sensitivity.value) / 100,
    );
    render();
    transmit();
  });
}

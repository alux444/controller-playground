import type { ControllerState } from "../server/protocol.ts";
import { element, socketUrl } from "./dom.ts";
import { steeringAngle, steeringInput } from "./steering.ts";

interface MotionEventConstructor {
  requestPermission?: () => Promise<"granted" | "denied">;
}

export function showController(app: HTMLElement, room: string): void {
  app.innerHTML = `
    <main class="phone-shell">
      <header class="phone-header"><span class="phone-logo">Controller playground</span><span class="phone-status" id="phone-status">Connecting…</span></header>
      <section class="phone-heading"><h1>Controller</h1><p>Choose a layout to try on the big screen.</p></section>
      <div class="configuration"><div class="player-picker"><span>Choose player</span><div role="group" aria-label="Player"><button type="button" data-slot="1" aria-pressed="false">Player 1</button><button type="button" data-slot="2" aria-pressed="false">Player 2</button></div></div>
      <nav class="mode-switch" id="mode-switch" aria-label="Controller type" inert><button type="button" data-mode="wheel" aria-pressed="true">Wheel</button><button type="button" data-mode="gamepad" aria-pressed="false">Gamepad</button></nav></div>
      <section class="controller" id="controller" inert>
        <div class="controller-head"><span id="controller-label">Wheel</span><span>Live input <span class="live-dot">●</span></span></div>
        <div id="wheel-controls">
          <div class="wheel-stage"><div class="phone-wheel" id="phone-wheel"><span></span><span></span><span></span><b>●</b></div></div>
          <p class="instruction" id="motion-instruction">Enable motion, then hold your phone like a wheel.</p>
          <div class="motion-actions"><button class="pill bright" id="motion" type="button">Enable motion</button><button class="pill subtle" id="recenter" type="button">Recenter</button></div>
          <label class="slider-label" for="sensitivity">Steering sensitivity <output id="sensitivity-value" for="sensitivity">100%</output></label><input id="sensitivity" type="range" min="70" max="200" step="10" value="100" aria-label="Steering sensitivity">
          <label class="slider-label" for="steering">Touch steering <span>← &nbsp; →</span></label><input id="steering" type="range" min="-100" max="100" value="0" aria-label="Touch steering">
        </div>
        <div id="gamepad-controls" hidden><div class="stick-stage"><div class="stick" id="stick" role="application" aria-label="Touch joystick"><span id="stick-knob"></span></div></div><p class="instruction">Drag to move. Release to return to centre.</p><div class="dpad" aria-label="Move with buttons"><button data-direction="up" aria-label="Up">↑</button><button data-direction="left" aria-label="Left">←</button><button data-direction="down" aria-label="Down">↓</button><button data-direction="right" aria-label="Right">→</button></div></div>
        <div class="actions"><button type="button" data-action="secondary"><span>B</span><small id="secondary-label">Brake</small></button><button type="button" data-action="primary"><span>A</span><small id="primary-label">Accelerate</small></button></div>
      </section>
      <footer class="phone-footer">Keep this page open while playing.</footer>
      <div class="rotate-prompt" role="status"><div class="rotate-icon" aria-hidden="true">↻</div><h2>Turn your phone sideways</h2><p>The controller works in landscape. If the screen doesn't rotate, turn off Portrait Orientation Lock.</p></div>
    </main>`;
  let socket = new WebSocket(socketUrl("player", room));
  const state: ControllerState = {
    mode: "wheel",
    x: 0,
    y: 0,
    primary: false,
    secondary: false,
  };
  const phoneStatus = element<HTMLElement>("#phone-status");
  const wheel = element<HTMLElement>("#phone-wheel");
  const slider = element<HTMLInputElement>("#steering");
  const portrait = window.matchMedia(
    "(orientation: portrait) and (pointer: coarse)",
  );
  let selectedSlot: number | undefined;
  let reconnectSlot: number | undefined;
  let takenSlots: number[] = [];
  let lobbyConnected = false;

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
    state.primary = false;
    state.secondary = false;
    document
      .querySelectorAll(".pressed")
      .forEach((button) => button.classList.remove("pressed"));
    element<HTMLElement>("#stick-knob").style.transform = "translate(0, 0)";
    render();
    transmit();
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
        phoneStatus.textContent = "Choose a player";
      }
      if (message.type === "joined") {
        selectedSlot = message.slot;
        reconnectSlot = undefined;
        phoneStatus.textContent = `● Player ${selectedSlot} connected`;
        phoneStatus.classList.add("connected");
        updatePlayerChoices();
        transmit();
      }
      if (message.type === "slots") {
        takenSlots = message.taken ?? [];
        updatePlayerChoices();
      }
      if (message.type === "slot-taken") {
        reconnectSlot = undefined;
        phoneStatus.textContent = `Player ${message.slot} is taken`;
        phoneStatus.classList.remove("connected");
      }
    });
    socket.addEventListener("close", (event) => {
      neutral();
      reconnectSlot = selectedSlot;
      selectedSlot = undefined;
      takenSlots = [];
      lobbyConnected = false;
      updatePlayerChoices();
      phoneStatus.classList.remove("connected");
      if (event.code === 1008 || event.code === 1000) {
        phoneStatus.textContent = "Session ended · Scan again";
        return;
      }
      phoneStatus.textContent = "Reconnecting…";
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

  const context: ControllerContext = {
    state,
    neutral,
    portrait,
    render,
    transmit,
  };
  bindModes(context);
  bindActionButtons(context);
  bindMotion(context);
  bindGamepad(context);
}

interface ControllerContext {
  state: ControllerState;
  neutral: () => void;
  portrait: MediaQueryList;
  render: () => void;
  transmit: () => void;
}

function bindModes({ state, neutral, transmit }: ControllerContext): void {
  document
    .querySelectorAll<HTMLButtonElement>("[data-mode]")
    .forEach((button) =>
      button.addEventListener("click", () => {
        neutral();
        state.mode = button.dataset.mode === "gamepad" ? "gamepad" : "wheel";
        document
          .querySelectorAll<HTMLButtonElement>("[data-mode]")
          .forEach((item) =>
            item.setAttribute("aria-pressed", String(item === button)),
          );
        element<HTMLElement>("#wheel-controls").hidden = state.mode !== "wheel";
        element<HTMLElement>("#gamepad-controls").hidden =
          state.mode !== "gamepad";
        element<HTMLElement>("#controller-label").textContent =
          state.mode === "wheel" ? "Wheel" : "Gamepad";
        element<HTMLElement>("#primary-label").textContent =
          state.mode === "wheel" ? "Accelerate" : "Action A";
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

function bindGamepad({ state, transmit }: ControllerContext): void {
  const stick = element<HTMLElement>("#stick");
  const knob = element<HTMLElement>("#stick-knob");
  function moveStick(event: PointerEvent): void {
    const bounds = stick.getBoundingClientRect();
    const dx =
      (event.clientX - bounds.left - bounds.width / 2) / (bounds.width / 2);
    const dy =
      (event.clientY - bounds.top - bounds.height / 2) / (bounds.height / 2);
    const length = Math.max(1, Math.hypot(dx, dy));
    state.x = dx / length;
    state.y = dy / length;
    knob.style.transform = `translate(${state.x * 48}px, ${state.y * 48}px)`;
    transmit();
  }
  stick.addEventListener("pointerdown", (event) => {
    event.preventDefault();
    stick.setPointerCapture(event.pointerId);
    moveStick(event);
  });
  stick.addEventListener("pointermove", (event) => {
    if (stick.hasPointerCapture(event.pointerId)) moveStick(event);
  });
  function releaseStick(): void {
    state.x = 0;
    state.y = 0;
    knob.style.transform = "translate(0, 0)";
    transmit();
  }
  stick.addEventListener("pointerup", releaseStick);
  stick.addEventListener("pointercancel", releaseStick);
  stick.addEventListener("lostpointercapture", releaseStick);
  document
    .querySelectorAll<HTMLButtonElement>("[data-direction]")
    .forEach((button) => {
      button.addEventListener("pointerdown", (event) => {
        event.preventDefault();
        button.setPointerCapture(event.pointerId);
        state.x =
          button.dataset.direction === "left"
            ? -1
            : button.dataset.direction === "right"
              ? 1
              : 0;
        state.y =
          button.dataset.direction === "up"
            ? -1
            : button.dataset.direction === "down"
              ? 1
              : 0;
        button.classList.add("pressed");
        transmit();
      });
      button.addEventListener("pointerup", () => {
        button.classList.remove("pressed");
        releaseStick();
      });
      button.addEventListener("pointercancel", () => {
        button.classList.remove("pressed");
        releaseStick();
      });
      button.addEventListener("click", (event) => {
        if (event.detail !== 0) return;
        state.x =
          button.dataset.direction === "left"
            ? -1
            : button.dataset.direction === "right"
              ? 1
              : 0;
        state.y =
          button.dataset.direction === "up"
            ? -1
            : button.dataset.direction === "down"
              ? 1
              : 0;
        transmit();
        setTimeout(releaseStick, 180);
      });
    });
}

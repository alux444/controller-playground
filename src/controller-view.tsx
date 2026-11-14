import { useEffect, useState, type PointerEvent, type ReactElement } from "react";
import type { ControllerState } from "../server/protocol.ts";
import { Button } from "./ui-kit/components/Button.tsx";
import { ControllerSettings } from "./controller-settings.tsx";
import { useControllerSession } from "./controller-session.ts";
import { useMotion } from "./use-motion.ts";
import { Stick } from "./stick-view.tsx";

type Mode = ControllerState["mode"];
const modeLabels: Record<Mode, string> = {
  wheel: "Wheel",
  gamepad: "Gamepad",
  "twin-stick": "Twin sticks",
  "motion-pointer": "Motion pointer",
};

interface ActionProps {
  action: "primary" | "secondary";
  label: string;
  pressed: boolean;
  update: (values: Partial<ControllerState>) => void;
}

function Action({ action, label, pressed, update }: ActionProps): ReactElement {
  function setPressed(value: boolean): void {
    update({ [action]: value });
  }
  function down(event: PointerEvent<HTMLButtonElement>): void {
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    setPressed(true);
  }
  return (
    <button
      type="button"
      data-action={action}
      className={pressed ? "pressed" : ""}
      onPointerDown={down}
      onPointerUp={() => setPressed(false)}
      onPointerCancel={() => setPressed(false)}
      onLostPointerCapture={() => setPressed(false)}
      onKeyDown={(event) => {
        if (event.key === " " || event.key === "Enter") setPressed(true);
      }}
      onKeyUp={(event) => {
        if (event.key === " " || event.key === "Enter") setPressed(false);
      }}
    >
      <span>{action === "primary" ? "A" : "B"}</span>
      <small>{label}</small>
    </button>
  );
}

export function ControllerView({ room }: { room: string }): ReactElement {
  const session = useControllerSession(room);
  const { input, selectedSlot, takenSlots, connected, status, select, update, neutral } =
    session;
  const [settingsOpen, setSettingsOpen] = useState(true);
  const [wheelSensitivity, setWheelSensitivity] = useState(100);
  const [pointerSensitivity, setPointerSensitivity] = useState(100);
  const [fullscreen, setFullscreen] = useState(false);
  const motion = useMotion(
    input,
    settingsOpen || selectedSlot === undefined,
    input.mode === "motion-pointer" ? pointerSensitivity : wheelSensitivity,
    update,
  );
  const paused = settingsOpen || selectedSlot === undefined;

  useEffect(() => {
    function resetWhenHidden(): void {
      if (document.hidden) neutral();
    }
    function resetOnRotation(): void {
      neutral();
      motion.reset();
    }
    function updateFullscreen(): void {
      setFullscreen(Boolean(document.fullscreenElement));
    }
    document.addEventListener("visibilitychange", resetWhenHidden);
    screen.orientation?.addEventListener("change", resetOnRotation);
    document.addEventListener("fullscreenchange", updateFullscreen);
    return () => {
      document.removeEventListener("visibilitychange", resetWhenHidden);
      screen.orientation?.removeEventListener("change", resetOnRotation);
      document.removeEventListener("fullscreenchange", updateFullscreen);
    };
  }, [neutral, motion.reset]);

  function openSettings(): void {
    neutral();
    setSettingsOpen(true);
  }
  function chooseMode(mode: Mode): void {
    neutral();
    update({ mode });
  }
  async function toggleFullscreen(): Promise<void> {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await document.documentElement.requestFullscreen();
    } catch {
      return;
    }
  }
  const modeLabel = modeLabels[input.mode];
  const primaryLabel =
    input.mode === "wheel"
      ? "Accelerate"
      : input.mode === "motion-pointer"
        ? "Fire"
        : "Action A";
  const secondaryLabel = input.mode === "wheel" ? "Brake" : "Action B";

  return (
    <main className="phone-shell" data-mode={input.mode}>
      <header className="phone-header">
        <div className="phone-identity">
          <span className="phone-logo">Controller</span>
          <span
            className={`phone-status ${selectedSlot !== undefined ? "connected" : ""}`}
            aria-live="polite"
          >
            {status}
          </span>
        </div>
        <div className="phone-header-actions">
          {document.fullscreenEnabled && (
            <Button variant="secondary" onClick={() => void toggleFullscreen()}>
              {fullscreen ? "Exit full screen" : "Full screen"}
            </Button>
          )}
          <Button variant="secondary" onClick={openSettings}>
            Settings
          </Button>
        </div>
      </header>
      <ControllerSettings
        open={settingsOpen}
        mode={input.mode}
        selectedSlot={selectedSlot}
        takenSlots={takenSlots}
        connected={connected}
        status={status}
        wheelSensitivity={wheelSensitivity}
        pointerSensitivity={pointerSensitivity}
        select={select}
        chooseMode={chooseMode}
        setWheelSensitivity={setWheelSensitivity}
        setPointerSensitivity={setPointerSensitivity}
        close={() => setSettingsOpen(false)}
      />
      <div className="rotate-prompt rotate-landscape" role="status">
        <div className="rotate-icon" aria-hidden="true">
          ↻
        </div>
        <h2>Turn your phone sideways</h2>
        <p>Use this controller in landscape, or choose Pointer to aim upright.</p>
      </div>
      <div className="rotate-prompt rotate-portrait" role="status">
        <div className="rotate-icon" aria-hidden="true">
          ↻
        </div>
        <h2>Turn your screen to portrait</h2>
        <p>Hold the phone like a remote, with its top edge pointing at the screen.</p>
      </div>
      <section className="controller" inert={selectedSlot === undefined}>
        <div className="controller-head">
          <span>{input.mode === "motion-pointer" ? "Motion pointer" : modeLabel}</span>
          <span>
            Live input <span className="live-dot">●</span>
          </span>
        </div>
        {input.mode === "wheel" && (
          <div id="wheel-controls">
            <div className="wheel-stage">
              <div
                className="phone-wheel"
                style={{ transform: `rotate(${input.x * 90}deg)` }}
              >
                <span />
                <span />
                <span />
                <b>●</b>
              </div>
            </div>
            <p className="instruction">{motion.instruction}</p>
            <div className="motion-actions">
              <Button onClick={() => void motion.enable()}>{motion.enableLabel}</Button>
              <Button variant="secondary" onClick={motion.recenter}>
                Recenter
              </Button>
            </div>
            <label className="slider-label" htmlFor="steering">
              Touch steering <span>← &nbsp; →</span>
            </label>
            <input
              id="steering"
              type="range"
              min="-100"
              max="100"
              value={Math.round(input.x * 100)}
              onChange={(event) => {
                motion.useTouch();
                update({ x: Number(event.target.value) / 100 });
              }}
              onPointerUp={() => update({ x: 0 })}
              onPointerCancel={() => update({ x: 0 })}
              onKeyUp={() => update({ x: 0 })}
            />
          </div>
        )}
        {input.mode === "gamepad" && (
          <div id="gamepad-controls">
            <div className="stick-stage">
              <Stick
                side="move"
                label="Joystick"
                input={input}
                paused={paused}
                update={update}
              />
            </div>
          </div>
        )}
        {input.mode === "twin-stick" && (
          <div id="twin-stick-controls">
            <div className="twin-pad">
              <Stick
                side="move"
                label="Move stick"
                input={input}
                paused={paused}
                update={update}
              />
              <span>Move</span>
            </div>
            <div className="twin-pad">
              <Stick
                side="aim"
                label="Aim stick"
                input={input}
                paused={paused}
                update={update}
              />
              <span>Aim</span>
            </div>
          </div>
        )}
        {input.mode === "motion-pointer" && (
          <div id="pointer-controls">
            <div className="pointer-preview" aria-hidden="true">
              <span
                id="pointer-dot"
                style={{
                  left: `${50 + input.aimX * 42}%`,
                  top: `${50 + input.aimY * 40}%`,
                }}
              />
            </div>
            <div className="pointer-settings">
              <p className="instruction">{motion.instruction}</p>
              <div className="motion-actions">
                <Button onClick={() => void motion.enable()}>{motion.enableLabel}</Button>
                <Button variant="secondary" onClick={motion.recenter}>
                  {motion.centerLabel}
                </Button>
              </div>
              <details>
                <summary>Touch aiming</summary>
                <label className="slider-label" htmlFor="pointer-x">
                  Left / right
                </label>
                <input
                  id="pointer-x"
                  type="range"
                  min="-100"
                  max="100"
                  value={Math.round(input.aimX * 100)}
                  onChange={(event) => {
                    motion.useTouch();
                    update({ aimX: Number(event.target.value) / 100 });
                  }}
                />
                <label className="slider-label" htmlFor="pointer-y">
                  Up / down
                </label>
                <input
                  id="pointer-y"
                  type="range"
                  min="-100"
                  max="100"
                  value={Math.round(input.aimY * 100)}
                  onChange={(event) => {
                    motion.useTouch();
                    update({ aimY: Number(event.target.value) / 100 });
                  }}
                />
              </details>
            </div>
          </div>
        )}
        {input.mode !== "twin-stick" && (
          <div className="actions">
            <Action
              action="secondary"
              label={secondaryLabel}
              pressed={input.secondary}
              update={update}
            />
            <Action
              action="primary"
              label={primaryLabel}
              pressed={input.primary}
              update={update}
            />
          </div>
        )}
      </section>
    </main>
  );
}

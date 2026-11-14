import { useEffect, useRef, type ReactElement } from "react";
import type { ControllerState } from "../server/protocol.ts";
import { Button } from "./ui-kit/components/Button.tsx";

type Mode = ControllerState["mode"];
const modes: { id: Mode; label: string }[] = [
  { id: "wheel", label: "Wheel" },
  { id: "gamepad", label: "Gamepad" },
  { id: "twin-stick", label: "Twin sticks" },
  { id: "motion-pointer", label: "Pointer" },
];

interface SettingsProps {
  open: boolean;
  mode: Mode;
  selectedSlot: number | undefined;
  takenSlots: number[];
  connected: boolean;
  status: string;
  wheelSensitivity: number;
  pointerSensitivity: number;
  select: (slot: number) => void;
  chooseMode: (mode: Mode) => void;
  setWheelSensitivity: (value: number) => void;
  setPointerSensitivity: (value: number) => void;
  close: () => void;
}

export function ControllerSettings({
  open,
  mode,
  selectedSlot,
  takenSlots,
  connected,
  status,
  wheelSensitivity,
  pointerSensitivity,
  select,
  chooseMode,
  setWheelSensitivity,
  setPointerSensitivity,
  close,
}: SettingsProps): ReactElement {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const current = dialog.current;
    if (!current) return;
    if (open && !current.open) current.showModal();
    if (!open && current.open) current.close();
  }, [open]);

  return (
    <dialog
      ref={dialog}
      className="settings-dialog"
      aria-labelledby="settings-title"
      onCancel={(event) => {
        event.preventDefault();
        if (selectedSlot !== undefined) close();
      }}
    >
      <div className="settings-head">
        <h1 id="settings-title">Controller settings</h1>
        <Button disabled={selectedSlot === undefined} onClick={close}>
          Done
        </Button>
      </div>
      <p className="settings-status" aria-live="polite">
        {status}
      </p>
      <div className="configuration">
        <div className="player-picker">
          <span>Choose player</span>
          <div role="group" aria-label="Player">
            {[1, 2].map((slot) => {
              const occupied = selectedSlot !== slot && takenSlots.includes(slot);
              return (
                <button
                  type="button"
                  key={slot}
                  disabled={!connected || occupied}
                  aria-pressed={selectedSlot === slot}
                  onClick={() => select(slot)}
                >
                  Player {slot}
                  {occupied ? " · Taken" : ""}
                </button>
              );
            })}
          </div>
        </div>
        <nav
          className="mode-switch"
          aria-label="Controller type"
          inert={selectedSlot === undefined}
        >
          {modes.map((item) => (
            <button
              type="button"
              key={item.id}
              aria-pressed={mode === item.id}
              onClick={() => chooseMode(item.id)}
            >
              {item.label}
            </button>
          ))}
        </nav>
      </div>
      {mode === "wheel" && (
        <section className="control-settings">
          <label className="slider-label" htmlFor="sensitivity">
            Steering sensitivity <output>{wheelSensitivity}%</output>
          </label>
          <input
            id="sensitivity"
            type="range"
            min="70"
            max="200"
            step="10"
            value={wheelSensitivity}
            onChange={(event) => setWheelSensitivity(Number(event.target.value))}
          />
        </section>
      )}
      {mode === "motion-pointer" && (
        <section className="control-settings">
          <label className="slider-label" htmlFor="pointer-sensitivity">
            Pointer sensitivity <output>{pointerSensitivity}%</output>
          </label>
          <input
            id="pointer-sensitivity"
            type="range"
            min="50"
            max="200"
            step="10"
            value={pointerSensitivity}
            onChange={(event) => setPointerSensitivity(Number(event.target.value))}
          />
        </section>
      )}
    </dialog>
  );
}

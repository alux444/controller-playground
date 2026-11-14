import {
  useEffect,
  useRef,
  type KeyboardEvent,
  type PointerEvent,
  type ReactElement,
} from "react";
import type { ControllerState } from "../server/protocol.ts";
import { setStick } from "./twin-stick.ts";

interface StickProps {
  side: "move" | "aim";
  label: string;
  input: ControllerState;
  paused: boolean;
  update: (values: Partial<ControllerState>) => void;
}

export function Stick({ side, label, input, paused, update }: StickProps): ReactElement {
  const pointer = useRef<number | undefined>(undefined);
  const pad = useRef<HTMLDivElement>(null);
  const keys = useRef(new Set<string>());
  const x = side === "move" ? input.x : input.aimX;
  const y = side === "move" ? input.y : input.aimY;

  function move(nextX: number, nextY: number): void {
    const next = { ...input };
    setStick(next, side, nextX, nextY);
    update(
      side === "move" ? { x: next.x, y: next.y } : { aimX: next.aimX, aimY: next.aimY },
    );
  }
  function reset(): void {
    const activePointer = pointer.current;
    pointer.current = undefined;
    if (activePointer !== undefined && pad.current?.hasPointerCapture(activePointer))
      pad.current.releasePointerCapture(activePointer);
    keys.current.clear();
    move(0, 0);
  }
  function movePointer(event: PointerEvent<HTMLDivElement>): void {
    if (event.pointerId !== pointer.current) return;
    const bounds = event.currentTarget.getBoundingClientRect();
    move(
      (event.clientX - bounds.left - bounds.width / 2) / (bounds.width / 2),
      (event.clientY - bounds.top - bounds.height / 2) / (bounds.height / 2),
    );
  }
  function onKey(event: KeyboardEvent<HTMLDivElement>, down: boolean): void {
    if (!["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(event.key)) return;
    event.preventDefault();
    if (down) keys.current.add(event.key);
    else keys.current.delete(event.key);
    move(
      Number(keys.current.has("ArrowRight")) - Number(keys.current.has("ArrowLeft")),
      Number(keys.current.has("ArrowDown")) - Number(keys.current.has("ArrowUp")),
    );
  }
  useEffect(() => {
    if (!paused) return;
    const activePointer = pointer.current;
    pointer.current = undefined;
    keys.current.clear();
    if (activePointer !== undefined && pad.current?.hasPointerCapture(activePointer))
      pad.current.releasePointerCapture(activePointer);
  }, [paused]);

  return (
    <div
      ref={pad}
      className="stick"
      role="application"
      tabIndex={0}
      aria-label={`${label}. Use arrow keys or touch.`}
      onPointerDown={(event) => {
        if (pointer.current !== undefined) return;
        event.preventDefault();
        pointer.current = event.pointerId;
        event.currentTarget.setPointerCapture(event.pointerId);
        movePointer(event);
      }}
      onPointerMove={movePointer}
      onPointerUp={(event) => {
        if (event.pointerId === pointer.current) reset();
      }}
      onPointerCancel={(event) => {
        if (event.pointerId === pointer.current) reset();
      }}
      onLostPointerCapture={(event) => {
        if (event.pointerId === pointer.current) reset();
      }}
      onKeyDown={(event) => onKey(event, true)}
      onKeyUp={(event) => onKey(event, false)}
      onBlur={() => {
        if (pointer.current === undefined) reset();
      }}
    >
      <span
        className="stick-knob"
        style={{ transform: `translate(${x * 92.86}%, ${y * 92.86}%)` }}
      />
    </div>
  );
}

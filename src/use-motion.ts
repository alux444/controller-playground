import { useCallback, useEffect, useRef, useState } from "react";
import type { ControllerState } from "../server/protocol.ts";
import { pointerAim, type Orientation } from "./motion-math.ts";
import { steeringAngle, steeringInput } from "./steering.ts";

interface MotionPermission {
  requestPermission?: () => Promise<"granted" | "denied">;
}

interface MotionControls {
  instruction: string;
  enableLabel: string;
  centerLabel: string;
  enable: () => Promise<void>;
  recenter: () => void;
  useTouch: () => void;
  reset: () => void;
}

export function useMotion(
  input: ControllerState,
  paused: boolean,
  sensitivity: number,
  update: (values: Partial<ControllerState>) => void,
): MotionControls {
  const [instruction, setInstruction] = useState(
    "Enable motion, then hold your phone like a wheel.",
  );
  const [enableLabel, setEnableLabel] = useState("Enable motion");
  const [centerLabel, setCenterLabel] = useState("Set centre");
  const current = useRef<Orientation | undefined>(undefined);
  const center = useRef<Orientation | undefined>(undefined);
  const currentAngle = useRef<number | undefined>(undefined);
  const centerAngle = useRef<number | undefined>(undefined);
  const enabled = useRef(false);
  const timeout = useRef<number | undefined>(undefined);
  const mode = input.mode;

  const reset = useCallback((): void => {
    current.current = undefined;
    center.current = undefined;
    currentAngle.current = undefined;
    centerAngle.current = undefined;
    setCenterLabel("Set centre");
  }, []);

  useEffect(() => {
    reset();
    enabled.current = false;
    setEnableLabel("Enable motion");
    setInstruction(
      mode === "motion-pointer"
        ? "Hold your phone like a remote, with its top edge pointing at the screen. Enable motion to begin."
        : "Enable motion, then hold your phone like a wheel.",
    );
  }, [mode, reset]);

  const enable = useCallback(async (): Promise<void> => {
    try {
      if (!window.isSecureContext || typeof DeviceOrientationEvent === "undefined")
        throw new Error("unavailable");
      const orientation = DeviceOrientationEvent as unknown as MotionPermission;
      if (
        typeof orientation.requestPermission === "function" &&
        (await orientation.requestPermission()) !== "granted"
      )
        throw new Error("denied");
      enabled.current = true;
      reset();
      setInstruction(
        mode === "motion-pointer"
          ? "Waiting for motion…"
          : "Waiting for motion… Hold your phone like a wheel.",
      );
      setEnableLabel("Waiting for motion…");
      window.clearTimeout(timeout.current);
      timeout.current = window.setTimeout(() => {
        if (!enabled.current || current.current || currentAngle.current !== undefined)
          return;
        setInstruction(
          mode === "motion-pointer"
            ? "Motion unavailable. Use the sliders to aim."
            : "No motion detected. Check your browser settings, or use touch steering.",
        );
        setEnableLabel("Try motion again");
      }, 3000);
    } catch {
      setInstruction(
        mode === "motion-pointer"
          ? "Motion unavailable. Use the sliders to aim."
          : "Motion unavailable. Use touch steering below; motion requires HTTPS and permission.",
      );
    }
  }, [mode, reset]);

  const recenter = useCallback((): void => {
    if (mode === "wheel") {
      centerAngle.current = currentAngle.current;
      update({ x: 0 });
      return;
    }
    if (!enabled.current || !current.current) {
      setInstruction("Enable motion first, then point at the centre of the screen.");
      return;
    }
    center.current = current.current;
    update({ aimX: 0, aimY: 0 });
    setCenterLabel("Recenter");
    setInstruction(
      "Point the top of your phone to aim. Tap Recenter to set a new centre.",
    );
  }, [mode, update]);

  const useTouch = useCallback((): void => {
    enabled.current = false;
    setEnableLabel("Enable motion");
    if (mode === "motion-pointer")
      setInstruction("Use the sliders to aim, or enable motion.");
  }, [mode]);

  useEffect(() => {
    function onOrientation(event: DeviceOrientationEvent): void {
      if (!enabled.current || paused || document.hidden) return;
      if (mode === "wheel") {
        if (
          window.matchMedia("(orientation: portrait) and (pointer: coarse)").matches ||
          event.beta === null ||
          event.gamma === null
        )
          return;
        const angle = steeringAngle(event.beta, event.gamma);
        currentAngle.current = angle;
        if (angle === undefined) {
          update({ x: 0 });
          setInstruction("Hold your phone more upright to steer.");
          return;
        }
        if (centerAngle.current === undefined) centerAngle.current = angle;
        setInstruction("Hold your phone like a wheel, then turn it to steer.");
        setEnableLabel("Motion enabled ✓");
        update({ x: steeringInput(angle, centerAngle.current, sensitivity / 100) });
        return;
      }
      if (
        mode !== "motion-pointer" ||
        window.matchMedia("(orientation: landscape) and (pointer: coarse)").matches ||
        event.alpha === null ||
        event.beta === null ||
        event.gamma === null ||
        ![event.alpha, event.beta, event.gamma].every(Number.isFinite)
      )
        return;
      const first = current.current === undefined;
      current.current = { alpha: event.alpha, beta: event.beta, gamma: event.gamma };
      if (first && !center.current) {
        setInstruction(
          "Point the top of your phone at the centre of the screen, then tap Set centre.",
        );
        setEnableLabel("Motion enabled ✓");
      }
      if (!center.current) return;
      const point = pointerAim(center.current, current.current, sensitivity / 100);
      update({ aimX: point.x, aimY: point.y });
    }
    function onVisibility(): void {
      if (document.hidden) reset();
    }
    window.addEventListener("deviceorientation", onOrientation);
    document.addEventListener("visibilitychange", onVisibility);
    screen.orientation?.addEventListener("change", reset);
    return () => {
      window.removeEventListener("deviceorientation", onOrientation);
      document.removeEventListener("visibilitychange", onVisibility);
      screen.orientation?.removeEventListener("change", reset);
    };
  }, [mode, paused, sensitivity, update, reset]);

  useEffect(() => () => window.clearTimeout(timeout.current), []);
  return { instruction, enableLabel, centerLabel, enable, recenter, useTouch, reset };
}

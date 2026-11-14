import type { ControllerState } from "../server/protocol.ts";
import { element } from "./dom.ts";

interface AimMarker {
  element: HTMLElement;
  active: boolean;
}

export interface AimStage {
  add: (id: string, slot: number) => void;
  update: (id: string, state: ControllerState) => void;
  pause: (id: string) => void;
  remove: (id: string) => void;
}

export function createAimStage(): AimStage {
  const panel = element<HTMLElement>("#aim-panel");
  const field = element<HTMLElement>("#aim-field");
  const markers = new Map<string, AimMarker>();

  function refresh(): void {
    panel.hidden = ![...markers.values()].some((marker) => marker.active);
  }

  function add(id: string, slot: number): void {
    const marker = document.createElement("div");
    marker.className = `aim-marker player-colour-${slot}`;
    marker.hidden = true;
    marker.setAttribute("aria-label", `Player ${slot} crosshair`);
    marker.innerHTML = `<span>${slot}</span>`;
    field.append(marker);
    markers.set(id, { element: marker, active: false });
  }

  function update(id: string, state: ControllerState): void {
    const marker = markers.get(id);
    if (!marker) return;
    marker.active =
      state.mode === "twin-stick" || state.mode === "motion-pointer";
    marker.element.hidden = !marker.active;
    marker.element.style.left = `${50 + 45 * state.aimX}%`;
    marker.element.style.top = `${50 + 45 * state.aimY}%`;
    marker.element.classList.toggle("firing", state.primary);
    refresh();
  }

  function pause(id: string): void {
    const marker = markers.get(id);
    if (!marker) return;
    marker.active = false;
    marker.element.hidden = true;
    refresh();
  }

  function remove(id: string): void {
    markers.get(id)?.element.remove();
    markers.delete(id);
    refresh();
  }

  return { add, update, pause, remove };
}

import assert from "node:assert/strict";
import { test } from "node:test";
import { runInNewContext } from "node:vm";
import { buildSync } from "esbuild";

interface TestNavigator {
  getGamepads: () => (Gamepad | null)[];
}

class TestWindow extends EventTarget {
  interval: (() => void) | undefined;
  setInterval(callback: () => void): number {
    this.interval = callback;
    return 1;
  }
}

function sendWheel(window: TestWindow, input: object): void {
  const event = new Event("message");
  Object.defineProperties(event, {
    source: { value: window },
    data: { value: { source: "controller-playground-phone-wheel", input } },
  });
  window.dispatchEvent(event);
}

test("virtual wheel preserves other controllers, reports input, and disconnects when updates stop", () => {
  const result = buildSync({
    entryPoints: ["extension/gamepad.ts"],
    bundle: true,
    write: false,
    platform: "browser",
    format: "iife",
  });
  const source = result.outputFiles[0]?.text;
  assert.ok(source);
  const physical = { id: "physical" } as Gamepad;
  const navigator: TestNavigator = { getGamepads: () => [physical, null] };
  const window = new TestWindow();
  let time = 1000;
  class TestDate extends Date {
    static now(): number {
      return time;
    }
  }
  let connected = 0;
  let disconnected = 0;
  window.addEventListener("gamepadconnected", () => {
    connected += 1;
  });
  window.addEventListener("gamepaddisconnected", () => {
    disconnected += 1;
  });
  runInNewContext(source, { navigator, window, Event, Date: TestDate, performance });
  sendWheel(window, { connected: true, steering: 0.42, accelerator: true, brake: false });
  const pads = navigator.getGamepads();
  assert.equal(pads[0], physical);
  assert.equal(pads[1]?.axes[0], 0.42);
  assert.equal(pads[1]?.buttons[7]?.value, 1);
  assert.equal(connected, 1);
  time += 1500;
  window.interval?.();
  assert.equal(navigator.getGamepads()[1], null);
  assert.equal(disconnected, 1);
});

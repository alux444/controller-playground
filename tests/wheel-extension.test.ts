import assert from "node:assert/strict";
import { test } from "node:test";
import { neutralState } from "../server/protocol.ts";
import { createGamepad, mapWheel } from "../extension/mapping.ts";

test("wheel input maps to analog steering and the game's accelerator and brake buttons", () => {
  const input = mapWheel({ ...neutralState, x: -0.35, primary: true, secondary: false });
  const pad = createGamepad(input, 2);
  assert.equal(pad.index, 2);
  assert.equal(pad.axes[0], -0.35);
  assert.equal(pad.buttons[7]?.value, 1);
  assert.equal(pad.buttons[6]?.value, 0);
});

test("other controller modes do not hold a virtual wheel or its buttons active", () => {
  const input = mapWheel({
    ...neutralState,
    mode: "gamepad",
    x: 1,
    primary: true,
    secondary: true,
  });
  const pad = createGamepad(input, 0);
  assert.equal(pad.connected, false);
  assert.equal(pad.axes[0], 0);
  assert.equal(pad.buttons[7]?.pressed, false);
  assert.equal(pad.buttons[6]?.pressed, false);
});

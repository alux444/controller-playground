import assert from "node:assert/strict";
import { test } from "node:test";
import { neutralState } from "../server/protocol.ts";
import { setStick } from "../src/twin-stick.ts";

test("both sticks move independently and release separately", () => {
  const state = { ...neutralState, mode: "twin-stick" as const };
  setStick(state, "move", 0.5, -0.5);
  setStick(state, "aim", 1, 0);
  assert.deepEqual(
    [state.x, state.y, state.aimX, state.aimY],
    [0.5, -0.5, 1, 0],
  );
  setStick(state, "move", 0, 0);
  assert.deepEqual([state.x, state.y, state.aimX, state.aimY], [0, 0, 1, 0]);
  setStick(state, "aim", 0, 0);
  assert.deepEqual([state.x, state.y, state.aimX, state.aimY], [0, 0, 0, 0]);
});

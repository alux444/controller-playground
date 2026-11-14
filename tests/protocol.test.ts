import assert from "node:assert/strict";
import { test } from "node:test";
import { neutralState, parseControllerState } from "../server/protocol.ts";

test("accepts controller input and rejects invalid or out-of-range values", () => {
  assert.deepEqual(parseControllerState(neutralState), neutralState);
  assert.equal(parseControllerState({ ...neutralState, x: 2 }), undefined);
  assert.equal(parseControllerState({ ...neutralState, y: NaN }), undefined);
  assert.equal(
    parseControllerState({ ...neutralState, primary: "yes" }),
    undefined,
  );
  assert.equal(parseControllerState(null), undefined);
});

test("keeps twin-stick movement and aiming independent", () => {
  const input = {
    ...neutralState,
    mode: "twin-stick",
    x: -0.5,
    y: 0.2,
    aimX: 0.8,
    aimY: -0.4,
  };
  assert.deepEqual(parseControllerState(input), input);
  assert.equal(parseControllerState({ ...input, aimX: 1.1 }), undefined);
  assert.equal(parseControllerState({ ...input, aimY: NaN }), undefined);
});

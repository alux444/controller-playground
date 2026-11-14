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

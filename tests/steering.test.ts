import assert from "node:assert/strict";
import { test } from "node:test";
import { steeringInput } from "../src/steering.ts";

test("default steering needs a wider turn and ignores movement near centre", () => {
  assert.equal(steeringInput(1, 0, 1), 0);
  assert.equal(steeringInput(-1, 0, 1), 0);
  assert.ok(steeringInput(45, 0, 1) < 0.4);
  assert.equal(steeringInput(120, 0, 1), 1);
  assert.equal(steeringInput(-120, 0, 1), -1);
});

test("sensitivity changes the steering response and angles wrap across 180 degrees", () => {
  assert.ok(steeringInput(30, 0, 2) > steeringInput(30, 0, 1));
  assert.ok(steeringInput(30, 0, 0.7) < steeringInput(30, 0, 1));
  assert.equal(steeringInput(-179, 179, 1), 0);
  assert.ok(steeringInput(-170, 170, 1) > 0);
});

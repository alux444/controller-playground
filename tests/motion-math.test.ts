import assert from "node:assert/strict";
import { test } from "node:test";
import { pointerAim } from "../src/motion-math.ts";

const center = { alpha: 0, beta: 0, gamma: 0 };

test("a phone held like a remote aims with its top edge", () => {
  assert.deepEqual(pointerAim(center, center, 1), { x: 0, y: 0 });
  const right = pointerAim(center, { ...center, alpha: 350 }, 1);
  const up = pointerAim(center, { ...center, beta: 10 }, 1);
  const roll = pointerAim(center, { ...center, gamma: 10 }, 1);
  assert.ok(right.x > 0.35 && right.x < 0.45);
  assert.ok(Math.abs(right.y) < 1e-9);
  assert.ok(up.y < -0.35 && up.y > -0.45);
  assert.ok(Math.abs(up.x) < 1e-9);
  assert.ok(Math.abs(roll.x) < 1e-9 && Math.abs(roll.y) < 1e-9);
});

test("aim remains continuous across the heading wrap and clamps to the screen", () => {
  const wrapped = pointerAim(
    { ...center, alpha: 359 },
    { ...center, alpha: 1 },
    1,
  );
  assert.ok(wrapped.x < -0.07 && wrapped.x > -0.09);
  assert.equal(pointerAim(center, { ...center, alpha: 300 }, 1).x, 1);
});

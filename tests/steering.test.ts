import assert from "node:assert/strict";
import { test } from "node:test";
import { steeringAngle, steeringInput } from "../src/steering.ts";

test("a sideways phone responds progressively to a small wheel turn", () => {
  const center = steeringAngle(0, 89);
  const left = steeringAngle(-20, 88.94);
  const right = steeringAngle(20, 88.94);
  assert.ok(center !== undefined && left !== undefined && right !== undefined);
  assert.ok(left - center < -15 && left - center > -25);
  assert.ok(right - center > 15 && right - center < 25);
  assert.ok(Math.abs(steeringInput(right, center, 1)) >= 0.5);
  assert.equal(steeringInput(center + 30, center, 1), 1);
});

test("default steering reaches full input after a comfortable turn", () => {
  assert.equal(steeringInput(1, 0, 1), 0);
  assert.equal(steeringInput(-1, 0, 1), 0);
  assert.ok(steeringInput(15, 0, 1) > 0.4 && steeringInput(15, 0, 1) < 0.6);
  assert.equal(steeringInput(30, 0, 1), 1);
  assert.equal(steeringInput(-30, 0, 1), -1);
  assert.equal(steeringAngle(0, 0), undefined);
});

test("turns stay continuous when the phone is held the other way around", () => {
  const center = steeringAngle(0, -89);
  const left = steeringAngle(20, -88.94);
  const right = steeringAngle(-20, -88.94);
  assert.ok(center !== undefined && left !== undefined && right !== undefined);
  assert.ok(steeringInput(left, center, 1) < -0.5);
  assert.ok(steeringInput(right, center, 1) > 0.5);
});

test("sensitivity changes the steering response and angles wrap across 180 degrees", () => {
  assert.ok(steeringInput(10, 0, 2) > steeringInput(10, 0, 1));
  assert.ok(steeringInput(10, 0, 0.7) < steeringInput(10, 0, 1));
  assert.equal(steeringInput(-179, 179, 1), 0);
  assert.ok(steeringInput(-170, 170, 1) > 0);
});

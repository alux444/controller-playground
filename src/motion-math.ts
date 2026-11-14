export interface Orientation {
  alpha: number;
  beta: number;
  gamma: number;
}

interface Quaternion {
  w: number;
  x: number;
  y: number;
  z: number;
}

interface AimPoint {
  x: number;
  y: number;
}

const POINTER_RANGE_DEGREES = 25;

function multiply(left: Quaternion, right: Quaternion): Quaternion {
  return {
    w:
      left.w * right.w - left.x * right.x - left.y * right.y - left.z * right.z,
    x:
      left.w * right.x + left.x * right.w + left.y * right.z - left.z * right.y,
    y:
      left.w * right.y - left.x * right.z + left.y * right.w + left.z * right.x,
    z:
      left.w * right.z + left.x * right.y - left.y * right.x + left.z * right.w,
  };
}

function quaternion({ alpha, beta, gamma }: Orientation): Quaternion {
  const half = Math.PI / 360;
  const z = {
    w: Math.cos(alpha * half),
    x: 0,
    y: 0,
    z: Math.sin(alpha * half),
  };
  const x = { w: Math.cos(beta * half), x: Math.sin(beta * half), y: 0, z: 0 };
  const y = {
    w: Math.cos(gamma * half),
    x: 0,
    y: Math.sin(gamma * half),
    z: 0,
  };
  return multiply(multiply(z, x), y);
}

function clamp(value: number): number {
  return Math.max(-1, Math.min(1, value));
}

export function pointerAim(
  center: Orientation,
  current: Orientation,
  sensitivity: number,
): AimPoint {
  const initial = quaternion(center);
  const inverse = { w: initial.w, x: -initial.x, y: -initial.y, z: -initial.z };
  const relative = multiply(inverse, quaternion(current));
  const sign = relative.w < 0 ? -1 : 1;
  const magnitude = Math.hypot(relative.x, relative.y, relative.z);
  if (magnitude < 1e-9) return { x: 0, y: 0 };
  const degrees =
    (2 * Math.atan2(sign * magnitude, sign * relative.w) * 180) / Math.PI;
  const xRotation = (relative.x / magnitude) * degrees;
  const zRotation = (relative.z / magnitude) * degrees;
  return {
    x: clamp((-zRotation / POINTER_RANGE_DEGREES) * sensitivity),
    y: clamp((-xRotation / POINTER_RANGE_DEGREES) * sensitivity),
  };
}

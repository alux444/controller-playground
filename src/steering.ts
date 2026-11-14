const FULL_TURN_DEGREES = 30;
const CENTER_DEAD_ZONE_DEGREES = 2;
const MINIMUM_GRAVITY_PROJECTION = 0.08;

export function steeringAngle(beta: number, gamma: number): number | undefined {
  const radians = Math.PI / 180;
  const sideways = Math.cos(beta * radians) * Math.sin(gamma * radians);
  const upright = Math.sin(beta * radians);
  if (Math.hypot(sideways, upright) < MINIMUM_GRAVITY_PROJECTION)
    return undefined;
  return (Math.atan2(upright, sideways) * 180) / Math.PI;
}

export function steeringInput(
  angle: number,
  center: number,
  sensitivity: number,
): number {
  const difference = ((((angle - center + 180) % 360) + 360) % 360) - 180;
  const turn = Math.max(0, Math.abs(difference) - CENTER_DEAD_ZONE_DEGREES);
  if (turn === 0) return 0;
  const range = FULL_TURN_DEGREES / sensitivity - CENTER_DEAD_ZONE_DEGREES;
  const output = Math.min(1, turn / range);
  return Math.sign(difference) * output;
}

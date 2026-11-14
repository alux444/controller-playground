const FULL_TURN_DEGREES = 120;
const CENTER_DEAD_ZONE_DEGREES = 2;

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

/** Logo circle geometry (viewBox 0 0 100 100). */
export const CIRCLE_CX = 50;
export const CIRCLE_CY = 50;
export const CIRCLE_R = 36.4;

export const LOADER_SWEEP_MIN = 360 * 0.18;
export const LOADER_SWEEP_MAX = 360 * 0.75;
export const LOADER_PULSE_MS = 1850;

/** Solid arc path from the top, clockwise — no stroke-dasharray. */
export function describeArc(sweepDeg) {
  if (sweepDeg < 0.5) {
    const x = CIRCLE_CX;
    const y = CIRCLE_CY - CIRCLE_R;
    return `M ${x} ${y} L ${x} ${y}`;
  }

  const toRad = (deg) => (deg * Math.PI) / 180;
  const start = -90;
  const end = start + sweepDeg;
  const x1 = CIRCLE_CX + CIRCLE_R * Math.cos(toRad(start));
  const y1 = CIRCLE_CY + CIRCLE_R * Math.sin(toRad(start));
  const x2 = CIRCLE_CX + CIRCLE_R * Math.cos(toRad(end));
  const y2 = CIRCLE_CY + CIRCLE_R * Math.sin(toRad(end));
  const large = sweepDeg > 180 ? 1 : 0;

  return `M ${x1} ${y1} A ${CIRCLE_R} ${CIRCLE_R} 0 ${large} 1 ${x2} ${y2}`;
}

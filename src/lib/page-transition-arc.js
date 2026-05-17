/** Logo circle geometry (viewBox 0 0 100 100). */
export const CIRCLE_CX = 50;
export const CIRCLE_CY = 50;
export const CIRCLE_R = 36.4;

export const COVER_SWEEP_MAX = 360;
/** One loop: ring empties, then fills again. */
export const LOADER_CYCLE_MS = 2400;

export function easeOutCubic(t) {
  return 1 - (1 - t) ** 3;
}

export function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2;
}

/** @param {number} t Cycle progress 0..1 — first half 360→0, second half 0→360. */
export function loaderSweepForCycle(t) {
  if (t < 0.5) {
    const p = easeInOutCubic(t * 2);
    return COVER_SWEEP_MAX * (1 - p);
  }
  const p = easeInOutCubic((t - 0.5) * 2);
  return COVER_SWEEP_MAX * p;
}

/** Closed ring — two semicircles (SVG single-arc 360° is degenerate). */
function describeFullCircle() {
  const top = `${CIRCLE_CX} ${CIRCLE_CY - CIRCLE_R}`;
  const bottom = `${CIRCLE_CX} ${CIRCLE_CY + CIRCLE_R}`;
  return `M ${top} A ${CIRCLE_R} ${CIRCLE_R} 0 0 1 ${bottom} A ${CIRCLE_R} ${CIRCLE_R} 0 0 1 ${top}`;
}

/** Solid arc path from the top, clockwise — no stroke-dasharray. */
export function describeArc(sweepDeg) {
  if (sweepDeg < 0.5) {
    const x = CIRCLE_CX;
    const y = CIRCLE_CY - CIRCLE_R;
    return `M ${x} ${y} L ${x} ${y}`;
  }

  if (sweepDeg >= COVER_SWEEP_MAX - 0.5) {
    return describeFullCircle();
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

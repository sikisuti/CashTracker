/**
 * The elbow drawn from the selected day row to the detail panel. The component only measures
 * three rectangles; the geometry lives here, where it can be tested without a browser.
 */

/** The part of a `DOMRect` the connector is built from. */
export interface Box {
  top: number;
  left: number;
  right: number;
  bottom: number;
}

/** Which way the selected row lies once it has scrolled off the screen. */
export type Offscreen = 'above' | 'below';

export interface Connector {
  /** `d` of the elbow, in the layout box's own coordinates. */
  path: string;
  /** Where the line begins: the row's own edge, or the screen edge once the row is past it. */
  x: number;
  y: number;
  /** `d` of the chevron that tips an off-screen line, or null when the row is in view. */
  cap: string | null;
  /** Set only while the row is off screen -- the direction the chevron points. */
  offscreen: Offscreen | null;
}

/** Corner rounding of the elbow. */
const RADIUS = 8;
/** How far from the panel's own corners the line is allowed to meet it. */
const PANEL_INSET = 20;
/** How far inside the screen edge an off-screen line stops, leaving room for its chevron. */
const EDGE_INSET = 16;
/** Under this much clear space the layout has stacked and there is no gutter left to draw in. */
const MIN_GUTTER = 12;
/** Half-width, and depth, of that chevron. */
const CAP = 4.5;

const round = (value: number): number => Math.round(value * 10) / 10;

const clamp = (value: number, low: number, high: number): number =>
  Math.min(Math.max(value, low), high);

/**
 * The line from `row` to `panel`, both measured in viewport coordinates and re-expressed relative
 * to `layout`. Null only where the columns have stacked and the panel no longer sits beside the
 * list: a row scrolled out of sight still gets a line, cut off at the screen edge.
 */
export function buildConnector(
  row: Box,
  panel: Box,
  layout: Box,
  viewportHeight: number,
): Connector | null {
  if (panel.left - row.right < MIN_GUTTER) {
    return null;
  }

  const rowMid = (row.top + row.bottom) / 2;
  const endX = round(panel.left - layout.left);
  // The vertical run sits halfway across the gutter, whichever end the line starts from.
  const midX = round((row.right + panel.left) / 2 - layout.left);

  // Meet the panel level with the row where that is possible, so a day beside the panel gets a
  // straight line; only a row above or below it needs the elbow.
  const low = panel.top + PANEL_INSET;
  const high = panel.bottom - PANEL_INSET;
  const meetY = high < low ? (panel.top + panel.bottom) / 2 : clamp(rowMid, low, high);
  const endY = round(meetY - layout.top);

  const offscreen = whereOffscreen(row, viewportHeight);
  if (offscreen) {
    // The row is gone, but the panel is pinned and still there, so keep the part of the line that
    // reaches it and tip it with a chevron pointing back the way the row went.
    const y = round(clamp(rowMid, EDGE_INSET, viewportHeight - EDGE_INSET) - layout.top);

    return {
      path: stub(midX, y, endX, endY),
      x: midX,
      y,
      cap: chevron(midX, y, offscreen),
      offscreen,
    };
  }

  const x = round(row.right - layout.left);
  const y = round(rowMid - layout.top);

  return { path: elbow(x, y, endX, endY, midX), x, y, cap: null, offscreen: null };
}

/** Off screen only once the whole row has passed the edge, so the anchor cannot flicker. */
function whereOffscreen(row: Box, viewportHeight: number): Offscreen | null {
  if (row.bottom < EDGE_INSET) {
    return 'above';
  }

  return row.top > viewportHeight - EDGE_INSET ? 'below' : null;
}

/** Row edge across the gutter, down or up the gutter, then into the panel. */
function elbow(x: number, y: number, endX: number, endY: number, midX: number): string {
  const drop = endY - y;
  if (Math.abs(drop) < 1) {
    return `M ${x} ${y} H ${endX}`;
  }

  const radius = round(Math.min(RADIUS, Math.abs(drop) / 2, (endX - x) / 2));
  const step = drop < 0 ? -radius : radius;

  return (
    `M ${x} ${y} H ${round(midX - radius)} ` +
    `Q ${midX} ${y} ${midX} ${round(y + step)} ` +
    `V ${round(endY - step)} ` +
    `Q ${midX} ${endY} ${round(midX + radius)} ${endY} ` +
    `H ${endX}`
  );
}

/** The same line with its row end cut away: it starts in the gutter, at the screen edge. */
function stub(midX: number, y: number, endX: number, endY: number): string {
  const drop = endY - y;
  if (Math.abs(drop) < 1) {
    return `M ${midX} ${y} H ${endX}`;
  }

  const radius = round(Math.min(RADIUS, Math.abs(drop), endX - midX));
  const step = drop < 0 ? -radius : radius;

  return (
    `M ${midX} ${y} ` +
    `V ${round(endY - step)} ` +
    `Q ${midX} ${endY} ${round(midX + radius)} ${endY} ` +
    `H ${endX}`
  );
}

function chevron(x: number, y: number, offscreen: Offscreen): string {
  const depth = offscreen === 'above' ? CAP : -CAP;

  return `M ${round(x - CAP)} ${round(y + depth)} L ${x} ${y} L ${round(x + CAP)} ${round(y + depth)}`;
}

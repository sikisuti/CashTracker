import { Box, buildConnector } from './connector.util';

describe('buildConnector', () => {
  const VIEWPORT = 800;

  /** The list is scrolled, so the layout starts well above the screen -- a wrong origin shows. */
  const layout: Box = { top: -1000, left: 40, right: 1000, bottom: 2000 };
  /** The panel is pinned, so it is on screen whatever the list is doing. */
  const panel: Box = { top: 120, left: 700, right: 1000, bottom: 520 };

  const row = (top: number, height = 24): Box => ({
    top,
    left: 40,
    right: 600,
    bottom: top + height,
  });

  it('should place the anchor at the row edge, in the layout box coordinates', () => {
    const line = buildConnector(row(300), panel, layout, VIEWPORT)!;

    expect(line.x).toBe(560); // 600 - 40
    expect(line.y).toBe(1312); // (300 + 324) / 2 + 1000
    expect(line.cap).toBeNull();
    expect(line.offscreen).toBeNull();
  });

  it('should run straight across when the row is level with the panel', () => {
    const line = buildConnector(row(300), panel, layout, VIEWPORT)!;

    expect(line.path).toBe('M 560 1312 H 660');
  });

  it('should elbow down to the panel when the row sits above it', () => {
    const line = buildConnector(row(120), panel, layout, VIEWPORT)!;

    // Meets the panel 20px below its top edge: 120 + 20 + 1000 = 1140, from y = 1132. The corners
    // round to half the 8px drop rather than to the full radius.
    expect(line.path).toBe('M 560 1132 H 606 Q 610 1132 610 1136 V 1136 Q 610 1140 614 1140 H 660');
  });

  it('should elbow up to the panel when the row sits below it', () => {
    const line = buildConnector(row(700), panel, layout, VIEWPORT)!;

    // Meets the panel 20px above its bottom edge: 520 - 20 + 1000 = 1500, from y = 1712.
    expect(line.path).toBe('M 560 1712 H 602 Q 610 1712 610 1704 V 1508 Q 610 1500 618 1500 H 660');
  });

  it('should keep the line on screen when the row has scrolled off the top', () => {
    const line = buildConnector(row(-400), panel, layout, VIEWPORT)!;

    // Starts in the middle of the gutter, 16px inside the top edge, and still reaches the panel.
    expect(line.offscreen).toBe('above');
    expect(line.x).toBe(610);
    expect(line.y).toBe(1016);
    expect(line.path).toBe('M 610 1016 V 1132 Q 610 1140 618 1140 H 660');
  });

  it('should point the chevron back the way the row went', () => {
    const above = buildConnector(row(-400), panel, layout, VIEWPORT)!;
    const below = buildConnector(row(900), panel, layout, VIEWPORT)!;

    expect(above.cap).toBe('M 605.5 1020.5 L 610 1016 L 614.5 1020.5');
    expect(below.cap).toBe('M 605.5 1779.5 L 610 1784 L 614.5 1779.5');
  });

  it('should keep the line on screen when the row has scrolled off the bottom', () => {
    const line = buildConnector(row(900), panel, layout, VIEWPORT)!;

    // Starts 16px inside the bottom edge and runs back up to the panel.
    expect(line.offscreen).toBe('below');
    expect(line.y).toBe(1784);
    expect(line.path).toBe('M 610 1784 V 1508 Q 610 1500 618 1500 H 660');
  });

  it('should hold the anchor on a row that is only half off the edge', () => {
    const line = buildConnector(row(4), panel, layout, VIEWPORT)!;

    expect(line.offscreen).toBeNull();
    expect(line.x).toBe(560);
  });

  it('should draw nothing once the columns have stacked and left no gutter', () => {
    const stacked: Box = { top: 120, left: 40, right: 600, bottom: 400 };

    expect(buildConnector(row(300), stacked, layout, VIEWPORT)).toBeNull();
  });
});

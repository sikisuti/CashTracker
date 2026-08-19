export interface NavItem {
  /** Router path the icon navigates to. */
  route: string;
  /** Accessible name, also shown as the hover label. */
  label: string;
  /** `d` attribute of the icon's SVG path, drawn as a 24x24 stroked outline. */
  iconPath: string;
}

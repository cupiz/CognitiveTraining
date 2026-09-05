/**
 * Minimal stroke icon set (24×24, 1.8px, round).
 * Replace emoji as UI glyphs with consistent vector icons.
 */

const PATHS: Record<string, React.ReactNode> = {
  users: (
    <>
      <path d="M15 19v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="8.5" cy="7" r="4" />
      <path d="M20 19v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </>
  ),
  gauge: (
    <>
      <path d="M12 14 15.5 9" />
      <path d="M3.5 18a9 9 0 1 1 17 0" />
      <path d="M3.6 18h16.8" />
    </>
  ),
  grid: (
    <>
      <rect x="3" y="3" width="7.5" height="7.5" rx="2" />
      <rect x="13.5" y="3" width="7.5" height="7.5" rx="2" />
      <rect x="3" y="13.5" width="7.5" height="7.5" rx="2" />
      <rect x="13.5" y="13.5" width="7.5" height="7.5" rx="2" />
    </>
  ),
  target: (
    <>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="5" />
      <circle cx="12" cy="12" r="1.2" fill="currentColor" stroke="none" />
    </>
  ),
  chart: (
    <>
      <path d="M4 20h16" />
      <path d="M6 20V11" />
      <path d="M12 20V6" />
      <path d="M18 20v-6" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </>
  ),
  calendar: (
    <>
      <rect x="3" y="5" width="18" height="16" rx="3" />
      <path d="M8 3v4M16 3v4M3 10h18" />
    </>
  ),
  logout: (
    <>
      <path d="M9 21H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h3" />
      <path d="m16 17 5-5-5-5" />
      <path d="M21 12H9" />
    </>
  ),
  "arrow-left": (
    <>
      <path d="M19 12H5" />
      <path d="m11 18-6-6 6-6" />
    </>
  ),
  "arrow-right": (
    <>
      <path d="M5 12h14" />
      <path d="m13 6 6 6-6 6" />
    </>
  ),
  plus: (
    <>
      <path d="M12 5v14M5 12h14" />
    </>
  ),
  check: <path d="m4.5 12.5 5 5 10-11" />,
  x: (
    <>
      <path d="M6 6l12 12M18 6 6 18" />
    </>
  ),
  trash: (
    <>
      <path d="M4 7h16" />
      <path d="M9 7V5a1.5 1.5 0 0 1 1.5-1.5h3A1.5 1.5 0 0 1 15 5v2" />
      <path d="M6.5 7 7.5 19.5A2 2 0 0 0 9.5 21.5h5a2 2 0 0 0 2-2L17.5 7" />
      <path d="M10 11v6M14 11v6" />
    </>
  ),
  pencil: (
    <>
      <path d="M17 3.5a2.2 2.2 0 0 1 3.1 3.1L7.5 19.3 3 20.6l1.3-4.5Z" />
      <path d="m14.5 6 3.5 3.5" />
    </>
  ),
  alert: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7.5V13" />
      <path d="M12 16.4h.01" />
    </>
  ),
  info: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v5.5" />
      <path d="M12 7.4h.01" />
    </>
  ),
  "sound-on": (
    <>
      <path d="M11 5 6.5 8.5H3v7h3.5L11 19Z" />
      <path d="M15 9a4.2 4.2 0 0 1 0 6" />
      <path d="M17.8 6.6a8 8 0 0 1 0 10.8" />
    </>
  ),
  "sound-off": (
    <>
      <path d="M11 5 6.5 8.5H3v7h3.5L11 19Z" />
      <path d="m16 9.5 5 5M21 9.5l-5 5" />
    </>
  ),
  pause: (
    <>
      <path d="M9 5.5v13M15 5.5v13" />
    </>
  ),
  play: <path d="M8 5.5v13l10-6.5Z" />,
  palette: (
    <>
      <path d="M12 3a9 9 0 1 0 0 18c1.4 0 2-.9 2-1.8 0-.9-.7-1.5-.7-2.2 0-.8.7-1.5 1.6-1.5h1.8A4.3 4.3 0 0 0 21 11.2C21 6.7 17 3 12 3Z" />
      <circle cx="7.5" cy="10.5" r="1" fill="currentColor" stroke="none" />
      <circle cx="12" cy="7.5" r="1" fill="currentColor" stroke="none" />
      <circle cx="16.5" cy="10.5" r="1" fill="currentColor" stroke="none" />
    </>
  ),
  door: (
    <>
      <path d="M13 4h5a2 2 0 0 1 2 2v14H13" />
      <path d="M15 20v2h-9a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1h9v2" />
      <path d="M9 12h4l-1.6-1.6" />
      <path d="m13.4 13.6-1.6-1.6" />
    </>
  ),
  shield: (
    <>
      <path d="M12 3 5 5.8v5.4c0 4.6 3 8.4 7 9.8 4-1.4 7-5.2 7-9.8V5.8Z" />
      <path d="m9.2 11.8 2 2 3.6-4" />
    </>
  ),
  activity: (
    <>
      <path d="M3 12h4l2.5-6 5 12 2.5-6h4" />
    </>
  ),
};

export type IconName = keyof typeof PATHS;

interface IconProps {
  name: IconName;
  className?: string;
  strokeWidth?: number;
}

export function Icon({ name, className = "size-5", strokeWidth = 1.8 }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {PATHS[name]}
    </svg>
  );
}

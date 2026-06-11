type IconProps = {
  className?: string;
};

const base = {
  fill: "none",
  stroke: "currentColor",
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

export const Ic = {
  pulse: <svg viewBox="0 0 24 24" {...base} strokeWidth="2.2"><path d="M3 12h4l2 6 4-14 2 8h6" /></svg>,
  upload: (
    <svg viewBox="0 0 24 24" {...base} strokeWidth="2">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
  ),
  file: (
    <svg viewBox="0 0 24 24" {...base} strokeWidth="1.8">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
    </svg>
  ),
  check: (
    <svg viewBox="0 0 24 24" {...base} strokeWidth="3">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  ),
  lock: (
    <svg viewBox="0 0 24 24" {...base} strokeWidth="2">
      <rect x="3" y="11" width="18" height="11" rx="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  ),
  download: (
    <svg viewBox="0 0 24 24" {...base} strokeWidth="2">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  ),
  mail: (
    <svg viewBox="0 0 24 24" {...base} strokeWidth="2">
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="m22 7-10 5L2 7" />
    </svg>
  ),
  copy: (
    <svg viewBox="0 0 24 24" {...base} strokeWidth="2">
      <rect x="9" y="9" width="13" height="13" rx="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  ),
  x: (
    <svg viewBox="0 0 24 24" {...base} strokeWidth="2.2">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  ),
  alert: (
    <svg viewBox="0 0 24 24" {...base} strokeWidth="2.2">
      <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  ),
  back: (
    <svg viewBox="0 0 24 24" {...base} strokeWidth="2">
      <line x1="19" y1="12" x2="5" y2="12" />
      <polyline points="12 19 5 12 12 5" />
    </svg>
  ),
  spark: (
    <svg viewBox="0 0 24 24" {...base} strokeWidth="2">
      <path d="M12 3v3m0 12v3M5.6 5.6l2.1 2.1m8.6 8.6 2.1 2.1M3 12h3m12 0h3M5.6 18.4l2.1-2.1m8.6-8.6 2.1-2.1" />
    </svg>
  ),
  inbox: (
    <svg viewBox="0 0 24 24" {...base} strokeWidth="1.8">
      <polyline points="22 12 16 12 14 15 10 15 8 12 2 12" />
      <path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
    </svg>
  ),
  shield: (
    <svg viewBox="0 0 24 24" {...base} strokeWidth="2">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  ),
  bars: (
    <svg viewBox="0 0 24 24" {...base} strokeWidth="2">
      <line x1="5" y1="20" x2="5" y2="14" />
      <line x1="10" y1="20" x2="10" y2="10" />
      <line x1="15" y1="20" x2="15" y2="6" />
      <line x1="20" y1="20" x2="20" y2="3" />
    </svg>
  ),
  clock: (
    <svg viewBox="0 0 24 24" {...base} strokeWidth="2">
      <circle cx="12" cy="12" r="9" />
      <polyline points="12 7 12 12 15.5 14" />
    </svg>
  ),
  trend: (
    <svg viewBox="0 0 24 24" {...base} strokeWidth="2">
      <polyline points="3 17 9 11 13 15 21 7" />
      <polyline points="15 7 21 7 21 13" />
    </svg>
  ),
  table: (
    <svg viewBox="0 0 24 24" {...base} strokeWidth="1.8">
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <line x1="3" y1="9" x2="21" y2="9" />
      <line x1="9" y1="9" x2="9" y2="20" />
      <line x1="15" y1="9" x2="15" y2="20" />
    </svg>
  ),
  ban: (
    <svg viewBox="0 0 24 24" {...base} strokeWidth="2">
      <circle cx="12" cy="12" r="9" />
      <line x1="5.6" y1="5.6" x2="18.4" y2="18.4" />
    </svg>
  ),
  target: (
    <svg viewBox="0 0 24 24" {...base} strokeWidth="2">
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="5" />
      <circle cx="12" cy="12" r="1" />
    </svg>
  ),
};

export function ExternalIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" {...base} strokeWidth="2">
      <path d="M7 17 17 7" />
      <path d="M8 7h9v9" />
    </svg>
  );
}


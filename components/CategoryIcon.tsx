// Refined line-icon set for service categories. Single visual language:
// 24×24, 1.7px stroke, round caps — calm and premium, never cartoon.
// Data (`lib/categories.ts`) keeps its emoji `icon` field untouched for DB
// mirroring; all public UI renders these SVGs instead.
const PATHS: Record<string, JSX.Element> = {
  electrician: <path d="M13 2 4 14h6l-1 8 9-12h-6l1-8z" />,
  plumber: <path d="M12 3c3 4.2 6 7.2 6 10.2a6 6 0 1 1-12 0C6 10.2 9 7 12 3z" />,
  "laptop-repair": (
    <>
      <rect x="4" y="4" width="16" height="11" rx="1" />
      <path d="M2 19h20" />
    </>
  ),
  "mobile-repair": (
    <>
      <rect x="7" y="2" width="10" height="20" rx="2" />
      <path d="M11 18.5h2" />
    </>
  ),
  "ac-repair": (
    <>
      <path d="M12 2v20" />
      <path d="M4 6l16 12" />
      <path d="M20 6 4 18" />
    </>
  ),
  "refrigerator-repair": (
    <>
      <rect x="8" y="2" width="8" height="20" rx="1" />
      <path d="M8 9.5h8" />
      <path d="M10 5.5v2M10 13v2" />
    </>
  ),
  "washing-machine-repair": (
    <>
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <circle cx="12" cy="13" r="4" />
      <path d="M7 6.5h4" />
    </>
  ),
  mechanic: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5.2 5.2l2.1 2.1M16.7 16.7l2.1 2.1M18.8 5.2l-2.1 2.1M7.3 16.7l-2.1 2.1" />
    </>
  ),
  tutor: <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />,
  photographer: (
    <>
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2v11z" />
      <circle cx="12" cy="13" r="4" />
    </>
  ),
  cleaner: <path d="M12 3l1.9 5.7 5.6 1.3-5.6 1.9L12 17.5l-1.9-5.6L4.5 10l5.6-1.3L12 3z" />,
  painter: (
    <>
      <rect x="3" y="4" width="12" height="4" rx="1" />
      <path d="M18 6h2v5h-7v2" />
      <path d="M13 13v8" />
    </>
  ),
  mover: (
    <>
      <path d="M1 4h14v12H1z" />
      <path d="M15 9h4l4 4v3h-8V9z" />
      <circle cx="5.5" cy="18.5" r="2" />
      <circle cx="18" cy="18.5" r="2" />
    </>
  ),
  tailor: (
    <>
      <circle cx="6" cy="6" r="3" />
      <circle cx="6" cy="18" r="3" />
      <path d="M20 4 8.5 15.5M14.5 14.5 20 20M8.5 8.5 12 12" />
    </>
  ),
  "makeup-artist": (
    <>
      <path d="M6 3h12l4 6-10 12L2 9l4-6z" />
      <path d="M2 9h20M9 3l3 6 3-6M12 9v12" />
    </>
  ),
  "car-bike-service": (
    <>
      <path d="M4 16v-4l2-5a2 2 0 0 1 1.9-1.3h8.2A2 2 0 0 1 18 7l2 5v4" />
      <path d="M3 12h18" />
      <circle cx="7.5" cy="16.5" r="1.8" />
      <circle cx="16.5" cy="16.5" r="1.8" />
    </>
  ),
  "internet-technician": (
    <>
      <path d="M4.5 11a11 11 0 0 1 15 0" />
      <path d="M7.5 14.5a6 6 0 0 1 9 0" />
      <path d="M12 18.5h.01" />
    </>
  ),
  "home-appliance-repair": (
    <>
      <path d="M9 2v6M15 2v6" />
      <path d="M6 8h12v4a6 6 0 0 1-12 0V8z" />
      <path d="M12 18v4" />
    </>
  ),
  "construction-worker": (
    <>
      <path d="M4 16a8 8 0 0 1 5-7.4V7a3 3 0 0 1 6 0v1.6A8 8 0 0 1 20 16" />
      <path d="M2 16h20" />
    </>
  ),
  "graphic-designer": <path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />,
  "video-editor": (
    <>
      <rect x="3" y="10" width="18" height="10" rx="2" />
      <path d="M3.5 10 5 4l15 3-1.5 4" />
      <path d="M8.5 5.2 7.8 9.5M12.5 5.8 11.8 10M16.5 6.4 15.8 10.5" />
    </>
  ),
  other: <path d="M12 5v14M5 12h14" />,
};

export default function CategoryIcon({ slug, className = "h-5 w-5" }: { slug: string; className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      {PATHS[slug] ?? PATHS.other}
    </svg>
  );
}

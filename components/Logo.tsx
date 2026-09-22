// Khojau lens-mark: a magnifier (search/discovery) whose lens holds ख,
// the first letter of the name. Black tile + gold line-art reads premium
// on both the white and black themes; the tile's hairline gold edge keeps
// it defined on dark surfaces.
export default function LogoMark({ className = "h-9 w-9" }: { className?: string }) {
  return (
    <svg viewBox="0 0 36 36" className={className} aria-hidden="true">
      <rect x="1" y="1" width="34" height="34" rx="9" fill="#0A0A0A" stroke="#C9A227" strokeOpacity="0.45" />
      <circle cx="15" cy="15" r="8" fill="none" stroke="#C9A227" strokeWidth="2.6" />
      <line x1="20.8" y1="20.8" x2="27" y2="27" stroke="#C9A227" strokeWidth="3" strokeLinecap="round" />
      <text x="15" y="19.5" textAnchor="middle" fontSize="10.5" fontWeight="700" fill="#C9A227">
        ख
      </text>
    </svg>
  );
}

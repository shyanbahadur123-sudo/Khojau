import type { Metadata } from "next";

interface Props {
  eyebrow: string;
  title: string;
  hint?: string;
  actions?: React.ReactNode;
}

// Shared premium page header for members-only pages. One place to tune
// rhythm/typography so Search, Recent, Saved, Dashboard stay in step.
export function PageHeader({ eyebrow, title, hint, actions }: Props) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3 pt-6 sm:pt-8">
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#7A5C00]">{eyebrow}</p>
        <h1 className="mt-1.5 break-words text-3xl font-bold leading-[1.1] tracking-tight sm:text-4xl">{title}</h1>
        {hint && <p className="mt-1 max-w-2xl break-words text-sm text-[#6B7280]">{hint}</p>}
      </div>
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </div>
  );
}

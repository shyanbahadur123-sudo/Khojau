interface Props {
  title: string;
  note?: React.ReactNode;
  children?: React.ReactNode;
}

// Shared inline alert for list pages. Softer than a full-width error block,
// visually consistent with the page headers.
export function InlineAlert({ title, note, children }: Props) {
  return (
    <div role="alert" className="rounded-xl border border-red-300/60 bg-red-500/10 p-4 text-sm text-[#6B7280] shadow-sm">
      <p><span className="font-semibold text-red-700">{title}</span></p>
      {note ? <p className="mt-1">{note}</p> : null}
      {children ? <div className="mt-3 flex flex-wrap gap-2">{children}</div> : null}
    </div>
  );
}

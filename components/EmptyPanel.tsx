interface Props {
  title: string;
  note?: React.ReactNode;
  children?: React.ReactNode;
}

// Shared empty/error panel. Calmer, premium-lite container for zero records.
export function EmptyPanel({ title, note, children }: Props) {
  return (
    <div className="rounded-3xl border border-black/10 bg-[#FFFFFF] p-8 text-center shadow-sm sm:p-10">
      <p className="break-words text-2xl font-bold tracking-tight">{title}</p>
      {note ? <p className="mx-auto mt-1 max-w-md text-sm text-[#6B7280]">{note}</p> : null}
      {children ? <div className="mt-4 flex flex-wrap justify-center gap-2">{children}</div> : null}
    </div>
  );
}

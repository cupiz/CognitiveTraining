export function EmptyCard({ title, empty }: { title: string; empty: string }) {
  return (
    <section className="card p-5 sm:p-6">
      <h3 className="text-[15px] font-semibold text-ink">{title}</h3>
      <div className="mt-5 rounded-lg border border-dashed border-line-strong bg-surface-2 px-4 py-8 text-center">
        <p className="mx-auto max-w-60 text-sm leading-relaxed text-ink-mute">{empty}</p>
      </div>
    </section>
  );
}

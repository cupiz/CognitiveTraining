import { Mark, Wordmark } from "@/components/ui/brand";
import { Icon } from "@/components/ui/icons";

const SELLING_POINTS = [
  {
    icon: "target" as const,
    title: "5 permainan berbasis sains",
    text: "Setiap permainan melatih satu domain kognitif — memori, atensi, kecepatan, kontrol, dan fleksibilitas.",
  },
  {
    icon: "activity" as const,
    title: "Tingkat kesulitan adaptif",
    text: "Tantangan selalu pas mengikuti kemampuan anak yang terus berkembang.",
  },
  {
    icon: "shield" as const,
    title: "Privat sejak awal",
    text: "Data milik orang tua. Profil anak terpisah sepenuhnya dari area akun dewasa.",
  },
];

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-dvh bg-canvas lg:grid-cols-[minmax(0,1fr)_minmax(420px,520px)]">
      {/* Panel brand — desktop */}
      <aside className="relative hidden overflow-hidden bg-brand-900 lg:flex lg:flex-col lg:justify-between lg:p-12 xl:p-16">
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(900px 480px at 15% 0%, rgb(20 149 125 / 0.35), transparent 60%), radial-gradient(700px 500px at 90% 100%, rgb(123 44 191 / 0.14), transparent 55%)",
          }}
        />
        <div className="relative">
          <Wordmark light />
        </div>

        <div className="relative max-w-md">
          <div className="mb-6 inline-flex size-14 items-center justify-center rounded-2xl bg-white/[0.07] text-white ring-1 ring-white/15">
            <Mark className="size-8" />
          </div>
          <h1 className="text-3xl font-bold leading-snug tracking-[-0.02em] text-white xl:text-4xl">
            Latihan kognitif yang pas dengan keseharian keluarga.
          </h1>
          <p className="mt-4 text-[15px] leading-relaxed text-white/70">
            Sesi singkat dan fokus yang benar-benar disukai anak — dengan laporan
            perkembangan yang mudah dibaca orang tua.
          </p>
        </div>

        <ul className="relative space-y-5">
          {SELLING_POINTS.map((point) => (
            <li key={point.title} className="flex items-start gap-3.5">
              <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-white/[0.08] text-emerald-300 ring-1 ring-white/10">
                <Icon name={point.icon} className="size-4" />
              </span>
              <div>
                <p className="text-sm font-semibold text-white">{point.title}</p>
                <p className="mt-0.5 text-[13px] leading-relaxed text-white/60">
                  {point.text}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </aside>

      {/* Kolom formulir */}
      <div className="relative flex flex-col px-5 py-10 sm:px-10">
        <div className="mb-8 flex justify-center lg:hidden">
          <Wordmark />
        </div>

        <div className="m-auto w-full max-w-sm">{children}</div>

        <p className="mt-10 text-center text-xs text-ink-faint lg:mt-8">
          © {new Date().getFullYear()} Platform Pelatihan Kognitif
        </p>
      </div>
    </div>
  );
}

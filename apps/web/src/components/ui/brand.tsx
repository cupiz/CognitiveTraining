/**
 * Brand wordmark + mark.
 * Geometric "neural focus" mark: three nodes, two connections, one center.
 */

export function Mark({ className = "size-6" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
      <rect x="1.5" y="1.5" width="29" height="29" rx="9" fill="currentColor" opacity="0.06" />
      <rect x="1.5" y="1.5" width="29" height="29" rx="9" fill="none" stroke="currentColor" strokeWidth="2" opacity="0.5" />
      <circle cx="10" cy="11" r="3" fill="currentColor" />
      <circle cx="22" cy="10" r="2.2" fill="currentColor" opacity="0.55" />
      <circle cx="23" cy="21" r="2.6" fill="currentColor" opacity="0.8" />
      <path
        d="M12.6 12.6 20.2 11M11.4 13.2 21.2 19.4"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

interface WordmarkProps {
  /** Light text for dark brand panels */
  light?: boolean;
  className?: string;
}

export function Wordmark({ light = false, className = "" }: WordmarkProps) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <Mark className={`size-7 ${light ? "text-white" : "text-brand-700"}`} />
      <span
        className={`text-[15px] font-bold tracking-[-0.01em] leading-none ${
          light ? "text-white" : "text-ink"
        }`}
      >
        Cognitive
        <span className={light ? "text-white/60 font-medium" : "text-ink-soft font-medium"}>
          {" "}
          Training
        </span>
      </span>
    </span>
  );
}

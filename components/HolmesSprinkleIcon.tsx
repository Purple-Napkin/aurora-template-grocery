"use client";

/**
 * Small sparkle/sprinkle icon indicating Holmes AI suggestion.
 * Tooltip shows "Holmes suggestion" on hover.
 */
export function HolmesSprinkleIcon({ className }: { className?: string }) {
  return (
    <span
      className={`inline-flex items-center justify-center ${className ?? ""}`}
      title="Personalised for you"
      aria-label="Personalised for you"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="currentColor"
        className="w-3.5 h-3.5 text-aurora-accent"
      >
        <path d="M12 1l1.5 4.5L18 7l-4.5 1.5L12 13l-1.5-4.5L6 7l4.5-1.5L12 1z" />
        <path d="M5 16l1 3 3 1-3 1-1 3-1-3-3-1 3-1 1-3z" opacity="0.7" />
        <path d="M19 19l1 3 3 1-3 1-1 3-1-3-3-1 3-1 1-3z" opacity="0.7" />
      </svg>
    </span>
  );
}

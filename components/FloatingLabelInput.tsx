"use client";

import { useId, useRef, useState } from "react";

interface FloatingLabelInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "placeholder"> {
  label: string;
  error?: string;
}

export function FloatingLabelInput({ label, error, id, className = "", value, ...props }: FloatingLabelInputProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const inputRef = useRef<HTMLInputElement>(null);
  const [focused, setFocused] = useState(false);

  const floatLabel = focused || Boolean(value != null && value !== "");

  return (
    <div className="relative">
      <input
        ref={inputRef}
        id={inputId}
        value={value}
        onFocus={(e) => { setFocused(true); props.onFocus?.(e); }}
        onBlur={(e) => { setFocused(false); props.onBlur?.(e); }}
        placeholder=" "
        className={`peer w-full h-12 px-4 rounded-xl bg-aurora-bg border text-aurora-text placeholder:text-transparent focus:outline-none focus:ring-2 focus:ring-aurora-primary/50 focus:border-aurora-primary transition-colors ${
          error ? "border-aurora-error" : "border-aurora-border"
        } ${className}`}
        {...props}
      />
      <label
        htmlFor={inputId}
        className={`absolute left-4 transition-all duration-200 pointer-events-none ${
          floatLabel
            ? "-top-1 -translate-y-full text-xs text-aurora-muted bg-aurora-bg px-1"
            : "top-1/2 -translate-y-1/2 text-base text-aurora-muted"
        }`}
      >
        {label}
      </label>
      {error && <p className="mt-1 text-sm text-aurora-error">{error}</p>}
    </div>
  );
}

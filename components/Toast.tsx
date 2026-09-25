"use client";
import { useEffect, useRef, useState } from "react";
import { AlertIcon, CheckIcon, CloseIcon, InfoIcon } from "@/components/UiIcon";

interface ToastProps {
  message: string;
  type?: "success" | "info" | "error";
  onClose: () => void;
}

export default function Toast({ message, type = "info", onClose }: ToastProps) {
  const [paused, setPaused] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Auto-dismiss pauses while hovered/focused so slow readers and screen
  // readers don't lose the message mid-announce.
  useEffect(() => {
    if (paused) return;
    timer.current = setTimeout(onClose, 6000);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [onClose, paused, message]);

  const bg = type === "success" ? "bg-[#111111]" : type === "error" ? "bg-red-700" : "bg-[#0A0A0A]";
  const Glyph = type === "success" ? CheckIcon : type === "error" ? AlertIcon : InfoIcon;
  return (
    <div
      role="status"
      aria-live="polite"
      aria-atomic="true"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      className={`fixed bottom-20 left-4 right-4 z-[100] rounded-xl ${bg} px-5 py-4 text-sm font-medium text-white shadow-2xl ring-1 ring-white/10 sm:left-auto sm:right-6 sm:bottom-6 sm:max-w-sm`}
    >
      <div className="flex items-center gap-3">
        <Glyph className="h-5 w-5 shrink-0" />
        <span>{message}</span>
        <button onClick={onClose} aria-label="Close notification" className="ml-auto grid h-11 w-11 shrink-0 place-items-center rounded-lg text-white/70 hover:bg-white/10 hover:text-white"><CloseIcon className="h-4 w-4" /></button>
      </div>
    </div>
  );
}

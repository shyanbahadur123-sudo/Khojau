"use client";
import { useEffect } from "react";
import { AlertIcon, CheckIcon, CloseIcon, InfoIcon } from "@/components/UiIcon";

interface ToastProps {
  message: string;
  type?: "success" | "info" | "error";
  onClose: () => void;
}

export default function Toast({ message, type = "info", onClose }: ToastProps) {
  useEffect(() => {
    const t = setTimeout(onClose, 4000);
    return () => clearTimeout(t);
  }, [onClose]);
  const bg = type === "success" ? "bg-[#111111]" : type === "error" ? "bg-red-700" : "bg-[#0A0A0A]";
  const Glyph = type === "success" ? CheckIcon : type === "error" ? AlertIcon : InfoIcon;
  return (
    <div role="status" aria-live="polite" className={`fixed bottom-6 right-6 z-[100] max-w-sm rounded-xl ${bg} px-5 py-4 text-sm font-medium text-white shadow-2xl ring-1 ring-white/10 transition-transform`}>
      <div className="flex items-center gap-3">
        <Glyph className="h-5 w-5 shrink-0" />
        <span>{message}</span>
        <button onClick={onClose} aria-label="Close notification" className="ml-auto grid h-8 w-8 shrink-0 place-items-center rounded-lg text-white/70 hover:bg-white/10 hover:text-white"><CloseIcon className="h-4 w-4" /></button>
      </div>
    </div>
  );
}

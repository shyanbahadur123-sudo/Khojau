"use client";

import { useEffect, useRef, useState } from "react";
import { CloseIcon } from "@/components/UiIcon";
import { createPortal } from "react-dom";

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void> | void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "destructive" | "primary";
  pending?: boolean;
  disabled?: boolean;
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "destructive",
  pending = false,
  disabled = false,
}: ConfirmDialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);

  const handleClose = () => {
    onClose();
  };

  const handleConfirm = async () => {
    try {
      await onConfirm();
    } finally {
      onClose();
    }
  };

  // Focus management and keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    // Store the element that triggered the dialog
    previousActiveElement.current = document.activeElement as HTMLElement;

    // Focus the dialog's close button or confirm button
    const focusableElements = dialogRef.current?.querySelectorAll<HTMLElement>(
      'button:not([disabled]), [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    if (focusableElements?.length) {
      // Focus the confirm button by default for destructive actions
      const confirmButton = dialogRef.current?.querySelector<HTMLButtonElement>(
        '[data-testid="confirm-button"]'
      );
      confirmButton?.focus();
    }

    // Prevent body scroll
    document.body.style.overflow = "hidden";

    // Handle escape key
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
      // Restore focus to trigger element
      previousActiveElement.current?.focus();
    };
  }, [isOpen, onClose]);

  // Focus trap
  useEffect(() => {
    if (!isOpen) return;

    const handleTab = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;

      const focusableElements = dialogRef.current?.querySelectorAll<HTMLElement>(
        'button:not([disabled]), [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );

      if (!focusableElements?.length) return;

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (e.shiftKey && document.activeElement === firstElement) {
        e.preventDefault();
        lastElement.focus();
      } else if (!e.shiftKey && document.activeElement === lastElement) {
        e.preventDefault();
        firstElement.focus();
      }
    };

    document.addEventListener("keydown", handleTab);
    return () => document.removeEventListener("keydown", handleTab);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const confirmButtonClass = `
    flex min-h-[44px] items-center justify-center gap-2 rounded-xl px-4 py-2 font-semibold text-sm
    transition-all duration-200
    ${variant === "destructive"
      ? "bg-red-600 text-white hover:bg-red-700 active:bg-red-800 focus:ring-2 focus:ring-red-500/50"
      : "bg-[#C9A227] text-[#0B0D10] hover:bg-[#B8941F] active:bg-[#A8841F] focus:ring-2 focus:ring-[#D4AF37]/50"
    }
    disabled:opacity-60 disabled:cursor-not-allowed
  `;

  const cancelButtonClass = `
    flex min-h-[44px] items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-medium
    transition-all duration-200
    text-zinc-400 hover:bg-white/[0.06] hover:text-white active:bg-white/10
    focus:outline-none focus-visible:ring-2 focus:ring-[#D4AF37]/50
  `;

  const dialogContent = (
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
      aria-describedby="confirm-dialog-message"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="w-full max-w-md mx-auto animate-in fade-in zoom-in-95 duration-200 rounded-2xl bg-[#FFFFFF] shadow-2xl overflow-hidden"
        role="document"
      >
        <div className="flex items-start justify-between gap-4 p-4 border-b border-black/10">
          <div className="flex-1 min-w-0">
            <h2
              id="confirm-dialog-title"
              className="text-lg font-semibold text-[#0A0A0A]"
            >
              {title}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="shrink-0 grid h-10 w-10 place-items-center rounded-lg text-zinc-400 transition-colors hover:bg-black/5 hover:text-[#0A0A0A] focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/50"
          >
            <CloseIcon className="h-5 w-5" />
          </button>
        </div>

        <div className="px-4 pb-4 pt-2">
          <p id="confirm-dialog-message" className="text-sm text-[#6B7280]">
            {message}
          </p>
        </div>

        <div className="flex w-full gap-2 p-4 pt-0 border-t border-black/10">
          <button
            type="button"
            onClick={onClose}
            disabled={disabled}
            className="flex-1 min-h-[44px] items-center justify-center gap-2 rounded-xl border border-black/15 px-4 py-2.5 text-sm font-medium transition-all hover:bg-black/5 active:bg-black/10 disabled:opacity-50"
          >
            {cancelText}
          </button>
          <button
            type="button"
            ref={(el) => {
              // Focus the confirm button on mount
              if (el) el.focus();
            }}
            onClick={handleConfirm}
            disabled={pending || disabled}
            data-testid="confirm-button"
            className={`
              flex-1 min-h-[44px] items-center justify-center gap-2 rounded-xl px-4 py-2 font-semibold text-sm transition-all duration-200
              ${variant === "destructive"
                ? "bg-red-600 text-white hover:bg-red-700 active:bg-red-800 focus:ring-2 focus:ring-red-500/50"
                : "bg-[#C9A227] text-[#0B0D10] hover:bg-[#B8941F] active:bg-[#A8841F]"
              }
              disabled:opacity-60 disabled:cursor-not-allowed
            `}
          >
            {pending ? (
              <>
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="3"
                    fill="none"
                    strokeDasharray="64"
                    strokeDashoffset="20"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M12 2a10 10 0 0 1 10 10"
                  />
                </svg>
                <span>Processing…</span>
              </>
            ) : (
              confirmText
            )}
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(dialogContent, document.body);
}

export function useConfirmDialog() {
  const [isOpen, setIsOpen] = useState(false);
  const [config, setConfig] = useState<{
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    variant?: "destructive" | "primary";
    onConfirm: () => void;
  } | null>(null);

  const open = (config: {
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    variant?: "destructive" | "primary";
    onConfirm: () => void;
  }) => {
    setConfig({
      title: config.title,
      message: config.message,
      confirmText: config.confirmText,
      cancelText: config.cancelText,
      variant: config.variant,
      onConfirm: config.onConfirm,
    });
    setIsOpen(true);
  };

  const close = () => {
    setIsOpen(false);
    setConfig(null);
  };

  return { isOpen, open, close };
}
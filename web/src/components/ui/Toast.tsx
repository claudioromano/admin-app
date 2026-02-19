"use client";

import { useToast } from "@/lib/context/ToastContext";

const typeStyles = {
  success: "bg-success-50 border-success-200 text-success-700",
  error: "bg-danger-50 border-danger-200 text-danger-700",
  warning: "bg-warning-50 border-warning-200 text-warning-700",
  info: "bg-primary-50 border-primary-200 text-primary-700",
};

const typeIcons = {
  success: "✓",
  error: "✕",
  warning: "!",
  info: "i",
};

export function ToastContainer() {
  const { toasts, removeToast } = useToast();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2 max-w-sm w-full px-4">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`flex items-start gap-3 rounded-lg border px-4 py-3 shadow-md animate-in fade-in slide-in-from-bottom-2 duration-200 ${typeStyles[toast.type]}`}
        >
          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-current/20 text-xs font-bold">
            {typeIcons[toast.type]}
          </span>
          <p className="flex-1 text-sm">{toast.message}</p>
          <button
            onClick={() => removeToast(toast.id)}
            className="shrink-0 text-current/60 hover:text-current transition-colors"
            aria-label="Cerrar"
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
}

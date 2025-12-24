"use client";
import React, { createContext, useCallback, useContext, useMemo, useState } from "react";

export type ToastKind = "info" | "success" | "error" | "warning";
export type ToastItem = { id: number; message: string; kind: ToastKind };

type ToastContextValue = {
  addToast: (message: string, kind?: ToastKind) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export const ToastProvider = ({ children }: { children: React.ReactNode }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const addToast = useCallback((message: string, kind: ToastKind = "info") => {
    setToasts((prev) => {
      const id = Date.now() + Math.random();
      return [...prev, { id, message, kind }];
    });
  }, []);

  const remove = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[9999] flex flex-col gap-2 px-2 pointer-events-none">
        {toasts.map((t) => (
          <Toast key={t.id} item={t} onDone={remove} />
        ))}
      </div>
    </ToastContext.Provider>
  );
};

function Toast({ item, onDone }: { item: ToastItem; onDone: (id: number) => void }) {
  React.useEffect(() => {
    const timer = setTimeout(() => onDone(item.id), 3500);
    return () => clearTimeout(timer);
  }, [item.id, onDone]);

  const colors: Record<ToastKind, { bg: string; border: string }> = {
    info: { bg: "bg-slate-800/90", border: "border-slate-500/60" },
    success: { bg: "bg-emerald-700/90", border: "border-emerald-400/70" },
    error: { bg: "bg-rose-700/90", border: "border-rose-400/70" },
    warning: { bg: "bg-amber-700/90", border: "border-amber-400/70" },
  };
  const c = colors[item.kind];

  return (
    <div
      className={`pointer-events-auto min-w-[280px] max-w-[420px] text-sm text-white px-4 py-3 rounded-xl border shadow-lg ${c.bg} ${c.border}`}
      role="alert"
    >
      {item.message}
    </div>
  );
}

export const useToastContext = () => useContext(ToastContext);

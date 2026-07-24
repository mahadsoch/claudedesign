"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";

// A tiny, dependency-free toast system. Replaces raw alert() calls so errors
// (and confirmations) surface as on-brand, non-blocking notices.

type ToastKind = "success" | "error" | "info";
interface ToastItem {
  id: number;
  kind: ToastKind;
  message: string;
}

interface ToastApi {
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
}

const ToastCtx = createContext<ToastApi | null>(null);

export function useToast(): ToastApi {
  const ctx = useContext(ToastCtx);
  if (!ctx) throw new Error("useToast must be used within <ToastProvider>");
  return ctx;
}

const KIND_COLOR: Record<ToastKind, string> = {
  success: "#4ea86b",
  error: "#ff8a80",
  info: "#8ab4ff",
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const [mounted, setMounted] = useState(false);
  const idRef = useRef(0);

  useEffect(() => setMounted(true), []);

  const push = useCallback((kind: ToastKind, message: string) => {
    const id = ++idRef.current;
    setItems((s) => [...s, { id, kind, message }]);
    setTimeout(() => setItems((s) => s.filter((t) => t.id !== id)), 4400);
  }, []);

  const api = useMemo<ToastApi>(
    () => ({
      success: (m) => push("success", m),
      error: (m) => push("error", m),
      info: (m) => push("info", m),
    }),
    [push]
  );

  return (
    <ToastCtx.Provider value={api}>
      {children}
      {mounted &&
        createPortal(
          <div className="toast-stack">
            {items.map((t) => (
              <div
                key={t.id}
                className="toast"
                style={{ borderLeftColor: KIND_COLOR[t.kind] }}
                onClick={() => setItems((s) => s.filter((x) => x.id !== t.id))}
              >
                {t.message}
              </div>
            ))}
          </div>,
          document.body
        )}
    </ToastCtx.Provider>
  );
}

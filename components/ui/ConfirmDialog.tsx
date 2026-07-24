"use client";

import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
  type ReactNode,
} from "react";

// A promise-based confirm() replacing the native blocking dialog, so destructive
// actions (replace the deck, discard freeform edits) get a consistent, on-brand
// gate. Usage: const ok = await confirm({ title, body, danger }); if (!ok) return;

export interface ConfirmOptions {
  title: string;
  body?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
}

type ConfirmFn = (opts: ConfirmOptions) => Promise<boolean>;

const ConfirmCtx = createContext<ConfirmFn | null>(null);

export function useConfirm(): ConfirmFn {
  const ctx = useContext(ConfirmCtx);
  if (!ctx) throw new Error("useConfirm must be used within <ConfirmProvider>");
  return ctx;
}

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [opts, setOpts] = useState<ConfirmOptions | null>(null);
  const resolver = useRef<((v: boolean) => void) | null>(null);

  const confirm = useCallback<ConfirmFn>((options) => {
    return new Promise<boolean>((resolve) => {
      resolver.current = resolve;
      setOpts(options);
    });
  }, []);

  const close = useCallback((value: boolean) => {
    resolver.current?.(value);
    resolver.current = null;
    setOpts(null);
  }, []);

  return (
    <ConfirmCtx.Provider value={confirm}>
      {children}
      {opts && (
        <div className="modal-backdrop" onClick={() => close(false)}>
          <div
            className="modal"
            style={{ width: 440 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-title">{opts.title}</div>
            {opts.body && <p className="modal-sub">{opts.body}</p>}
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 20 }}>
              <button className="btn" onClick={() => close(false)}>
                {opts.cancelLabel ?? "Cancel"}
              </button>
              <button
                className={"btn primary" + (opts.danger ? " danger" : "")}
                onClick={() => close(true)}
                autoFocus
              >
                {opts.confirmLabel ?? "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmCtx.Provider>
  );
}

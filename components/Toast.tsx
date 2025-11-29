"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
} from "react";

/* ------------------------------
   Types
------------------------------ */

export type ToastType = "default" | "success" | "error" | "warning";

export interface Toast {
  id: number;
  message: string;
  type: ToastType;
}

export interface ToastContextValue {
  addToast: (message: string, type?: ToastType) => void;
}

/* ------------------------------
   Context (typed)
------------------------------ */

const ToastContext = createContext<ToastContextValue | null>(null);

/* ------------------------------
   Provider
------------------------------ */

interface ToastProviderProps {
  children: ReactNode;
}

export const ToastProvider = ({ children }: ToastProviderProps) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((message: string, type: ToastType = "default") => {
    const id = Date.now();
    const newToast: Toast = { id, message, type };

    setToasts((prev) => [...prev, newToast]);

    // Auto-remove after 3 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 5000);
  }, []);

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}

      {/* Toast Renderer */}
      <div className="fixed bottom-56 left-5 flex flex-col gap-2 z-50 w-80">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`px-4 py-2 rounded-lg shadow-md text-white text-center text-sm font-bold transition-all duration-300
              ${
                t.type === "success"
                  ? "bg-black"
                  : t.type === "error"
                  ? "bg-red-600"
                  : t.type === "warning"
                  ? "bg-yellow-600"
                  : "bg-gray-800"
              }`}
          >
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

/* ------------------------------
   Hook (typed)
------------------------------ */

export const useToast = (): ToastContextValue => {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast must be used inside <ToastProvider>");
  }
  return ctx;
};

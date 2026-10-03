import { useState, useCallback } from 'react';

interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
}

let toastId = 0;

const listeners: Set<(toast: Toast) => void> = new Set();
const removeListeners: Set<(id: number) => void> = new Set();

export function showToast(message: string, type: Toast['type'] = 'info') {
  const toast: Toast = { id: ++toastId, message, type };
  listeners.forEach((fn) => fn(toast));
  setTimeout(() => {
    removeListeners.forEach((fn) => fn(toast.id));
  }, 3000);
}

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((toast: Toast) => {
    setToasts((prev) => [...prev.slice(-4), toast]);
  }, []);

  const removeToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Register listeners
  useState(() => {
    listeners.add(addToast);
    removeListeners.add(removeToast);
    return () => {
      listeners.delete(addToast);
      removeListeners.delete(removeToast);
    };
  });

  return { toasts, removeToast };
}

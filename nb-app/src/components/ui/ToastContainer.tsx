import React from 'react';
import { useUiStore } from '../../store/useUiStore';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useUiStore();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-100 flex flex-col gap-2 w-full max-w-sm px-4">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`
            flex items-center gap-3 rounded-lg p-4 shadow-lg border transition-all animate-in fade-in slide-in-from-top-2
            ${
              toast.type === 'success'
                ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-800 dark:text-green-200'
                : toast.type === 'error'
                ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-800 dark:text-red-200'
                : 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-200'
            }
          `}
        >
          {toast.type === 'success' && <CheckCircle className="h-5 w-5 shrink-0" />}
          {toast.type === 'error' && <AlertCircle className="h-5 w-5 shrink-0" />}
          {toast.type === 'info' && <Info className="h-5 w-5 shrink-0" />}
          
          <p className="flex-1 text-sm font-medium">{toast.message}</p>
          
          <button
            onClick={() => removeToast(toast.id)}
            className="rounded-full p-1 hover:bg-black/5 dark:hover:bg-white/10 transition"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  );
};

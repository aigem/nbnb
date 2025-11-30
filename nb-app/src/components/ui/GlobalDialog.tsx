import React from 'react';
import { useUiStore } from '../../store/useUiStore';
import { AlertTriangle, Info } from 'lucide-react';

export const GlobalDialog: React.FC = () => {
  const { dialog, closeDialog } = useUiStore();

  if (!dialog) return null;

  const handleConfirm = () => {
    dialog.onConfirm();
    closeDialog();
  };

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/50 dark:bg-black/80 backdrop-blur-sm px-4 animate-in fade-in duration-200">
      <div 
        className="w-full max-w-md rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-2xl p-6 transform transition-all animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        <div className="flex flex-col items-center text-center">
          <div className={`mb-4 rounded-full p-3 ${
             dialog.type === 'alert' 
               ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
               : 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400'
          }`}>
            {dialog.type === 'alert' ? (
                <Info className="h-6 w-6" />
            ) : (
                <AlertTriangle className="h-6 w-6" />
            )}
          </div>

          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            {dialog.title || (dialog.type === 'alert' ? '提示' : '确认操作')}
          </h3>
          
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
            {dialog.message}
          </p>

          <div className="flex gap-3 w-full">
            {dialog.type !== 'alert' && (
                <button
                onClick={closeDialog}
                className="flex-1 rounded-lg px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition"
                >
                {dialog.cancelLabel || '取消'}
                </button>
            )}
            
            <button
              onClick={handleConfirm}
              className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium text-white transition shadow-lg ${
                 dialog.type === 'alert'
                    ? 'bg-blue-600 hover:bg-blue-500 shadow-blue-500/20'
                    : 'bg-red-600 hover:bg-red-500 shadow-red-500/20'
              }`}
            >
              {dialog.confirmLabel || '确认'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

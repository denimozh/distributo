"use client";

import { useState, useEffect, createContext, useContext, useCallback } from 'react';

// Toast Context
const ToastContext = createContext(null);

// Toast types with their styles
const toastStyles = {
  success: {
    bg: 'bg-green-50 border-green-200',
    icon: '✅',
    iconBg: 'bg-green-100',
    text: 'text-green-800',
    progress: 'bg-green-500',
  },
  error: {
    bg: 'bg-red-50 border-red-200',
    icon: '❌',
    iconBg: 'bg-red-100',
    text: 'text-red-800',
    progress: 'bg-red-500',
  },
  warning: {
    bg: 'bg-amber-50 border-amber-200',
    icon: '⚠️',
    iconBg: 'bg-amber-100',
    text: 'text-amber-800',
    progress: 'bg-amber-500',
  },
  info: {
    bg: 'bg-blue-50 border-blue-200',
    icon: 'ℹ️',
    iconBg: 'bg-blue-100',
    text: 'text-blue-800',
    progress: 'bg-blue-500',
  },
  loading: {
    bg: 'bg-gray-50 border-gray-200',
    icon: '⏳',
    iconBg: 'bg-gray-100',
    text: 'text-gray-800',
    progress: 'bg-gray-500',
  },
};

// Individual Toast Component
function Toast({ id, type = 'info', title, message, duration = 5000, onClose, action }) {
  const [isLeaving, setIsLeaving] = useState(false);
  const [progress, setProgress] = useState(100);
  const style = toastStyles[type] || toastStyles.info;

  useEffect(() => {
    if (duration === Infinity) return;

    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, 100 - (elapsed / duration) * 100);
      setProgress(remaining);

      if (remaining === 0) {
        clearInterval(interval);
        handleClose();
      }
    }, 50);

    return () => clearInterval(interval);
  }, [duration]);

  const handleClose = () => {
    setIsLeaving(true);
    setTimeout(() => onClose(id), 300);
  };

  return (
    <div
      className={`
        relative overflow-hidden
        w-full max-w-sm p-4 rounded-xl border shadow-lg
        transform transition-all duration-300 ease-out
        ${style.bg}
        ${isLeaving ? 'opacity-0 translate-x-full' : 'opacity-100 translate-x-0'}
      `}
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className={`flex-shrink-0 w-8 h-8 rounded-lg ${style.iconBg} flex items-center justify-center`}>
          {type === 'loading' ? (
            <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
          ) : (
            <span className="text-sm">{style.icon}</span>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {title && (
            <p className={`font-semibold text-sm ${style.text}`}>{title}</p>
          )}
          {message && (
            <p className={`text-sm ${style.text} ${title ? 'mt-0.5 opacity-80' : ''}`}>
              {message}
            </p>
          )}
          {action && (
            <button
              onClick={() => {
                action.onClick();
                handleClose();
              }}
              className={`mt-2 text-sm font-medium ${style.text} hover:underline`}
            >
              {action.label}
            </button>
          )}
        </div>

        {/* Close Button */}
        <button
          onClick={handleClose}
          className={`flex-shrink-0 p-1 rounded-lg hover:bg-black/5 ${style.text} opacity-60 hover:opacity-100 transition-opacity`}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Progress Bar */}
      {duration !== Infinity && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/5">
          <div
            className={`h-full ${style.progress} transition-all duration-100 ease-linear`}
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </div>
  );
}

// Toast Container Component
function ToastContainer({ toasts, removeToast }) {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
      {toasts.map((toast) => (
        <div key={toast.id} className="pointer-events-auto">
          <Toast {...toast} onClose={removeToast} />
        </div>
      ))}
    </div>
  );
}

// Toast Provider
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((options) => {
    const id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
    const toast = { id, ...options };
    setToasts((prev) => [...prev, toast]);
    return id;
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const updateToast = useCallback((id, options) => {
    setToasts((prev) =>
      prev.map((t) => (t.id === id ? { ...t, ...options } : t))
    );
  }, []);

  // Convenience methods
  const toast = useCallback((message, options = {}) => {
    return addToast({ message, ...options });
  }, [addToast]);

  toast.success = (message, options = {}) => addToast({ type: 'success', message, ...options });
  toast.error = (message, options = {}) => addToast({ type: 'error', message, ...options });
  toast.warning = (message, options = {}) => addToast({ type: 'warning', message, ...options });
  toast.info = (message, options = {}) => addToast({ type: 'info', message, ...options });
  toast.loading = (message, options = {}) => addToast({ type: 'loading', message, duration: Infinity, ...options });

  toast.dismiss = removeToast;
  toast.update = updateToast;

  // Promise helper
  toast.promise = async (promise, { loading, success, error }) => {
    const id = toast.loading(loading);
    try {
      const result = await promise;
      updateToast(id, { type: 'success', message: success, duration: 5000 });
      return result;
    } catch (err) {
      updateToast(id, { type: 'error', message: error || err.message, duration: 5000 });
      throw err;
    }
  };

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </ToastContext.Provider>
  );
}

// Hook to use toast
export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

export default Toast;
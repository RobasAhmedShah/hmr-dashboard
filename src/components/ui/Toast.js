import React, { useState, useEffect, useCallback, createContext, useContext } from 'react';
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react';

// Toast Context
const ToastContext = createContext(null);

// Toast Types
const TOAST_TYPES = {
  success: {
    icon: CheckCircle,
    bgClass: 'bg-green-500',
    borderClass: 'border-green-600',
    iconClass: 'text-white'
  },
  error: {
    icon: AlertCircle,
    bgClass: 'bg-red-500',
    borderClass: 'border-red-600',
    iconClass: 'text-white'
  },
  warning: {
    icon: AlertTriangle,
    bgClass: 'bg-amber-500',
    borderClass: 'border-amber-600',
    iconClass: 'text-white'
  },
  info: {
    icon: Info,
    bgClass: 'bg-blue-500',
    borderClass: 'border-blue-600',
    iconClass: 'text-white'
  }
};

// Individual Toast Component
const Toast = ({ id, message, type = 'info', onRemove }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  
  const config = TOAST_TYPES[type] || TOAST_TYPES.info;
  const Icon = config.icon;

  const handleRemove = useCallback(() => {
    setIsExiting(true);
    setTimeout(() => onRemove(id), 300);
  }, [id, onRemove]);

  useEffect(() => {
    if (isHovered) return;
    
    const timer = setTimeout(() => {
      handleRemove();
    }, 2000);

    return () => clearTimeout(timer);
  }, [isHovered, handleRemove]);

  return (
    <div
      className={`
        flex items-start gap-3 p-4 rounded-lg shadow-lg border
        ${config.bgClass} ${config.borderClass}
        transform transition-all duration-300 ease-out
        ${isExiting ? 'opacity-0 translate-x-full' : 'opacity-100 translate-x-0'}
        max-w-sm w-full cursor-pointer
      `}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleRemove}
    >
      <Icon className={`w-5 h-5 flex-shrink-0 mt-0.5 ${config.iconClass}`} />
      <div className="flex-1 min-w-0">
        <p className="text-sm text-white font-medium whitespace-pre-line break-words">
          {message}
        </p>
      </div>
      <button
        onClick={(e) => {
          e.stopPropagation();
          handleRemove();
        }}
        className="flex-shrink-0 text-white/70 hover:text-white transition-colors"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};

// Toast Container
const ToastContainer = ({ toasts, removeToast }) => {
  return (
    <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none">
      {toasts.map((toast) => (
        <div key={toast.id} className="pointer-events-auto">
          <Toast
            id={toast.id}
            message={toast.message}
            type={toast.type}
            onRemove={removeToast}
          />
        </div>
      ))}
    </div>
  );
};

// Toast Provider
export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'info') => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);
    return id;
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const toast = {
    success: (message) => addToast(message, 'success'),
    error: (message) => addToast(message, 'error'),
    warning: (message) => addToast(message, 'warning'),
    info: (message) => addToast(message, 'info'),
  };

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </ToastContext.Provider>
  );
};

// Custom hook to use toast
export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

export default Toast;


import React from 'react';
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react';

const Toast = ({ message, type = 'info', onClose }) => {
  const typeStyles = {
    success: 'bg-green-500 border-green-600',
    error: 'bg-red-500 border-red-600',
    warning: 'bg-yellow-500 border-yellow-600',
    info: 'bg-blue-500 border-blue-600'
  };

  const icons = {
    success: <CheckCircle size={20} />,
    error: <AlertCircle size={20} />,
    warning: <AlertTriangle size={20} />,
    info: <Info size={20} />
  };

  return (
    <div
      className={`fixed top-4 right-4 p-4 rounded-lg shadow-lg ${typeStyles[type]} text-white z-50 flex items-center gap-3 min-w-[300px] max-w-md border-l-4 animate-in slide-in-from-top-5 duration-300 print:hidden`}
      role="alert"
      aria-live="assertive"
    >
      <div className="flex-shrink-0">
        {icons[type]}
      </div>
      <div className="flex-grow">
        <p className="text-sm font-medium">{message}</p>
      </div>
      <button
        onClick={onClose}
        className="flex-shrink-0 hover:bg-white/20 rounded p-1 transition-colors"
        aria-label="Stäng notifikation"
      >
        <X size={18} />
      </button>
    </div>
  );
};

export default Toast;

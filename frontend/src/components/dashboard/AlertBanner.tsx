'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, CheckCircle, Info, X, Bell } from 'lucide-react';
import { cn } from '@/lib/utils';

export type AlertType = 'success' | 'warning' | 'error' | 'info';

interface AlertBannerProps {
  title: string;
  message: string;
  type?: AlertType;
  isVisible: boolean;
  onClose: () => void;
  autoClose?: number;
}

export const AlertBanner: React.FC<AlertBannerProps> = ({
  title,
  message,
  type = 'info',
  isVisible,
  onClose,
  autoClose = 5000
}) => {
  React.useEffect(() => {
    if (isVisible && autoClose) {
      const timer = setTimeout(onClose, autoClose);
      return () => clearTimeout(timer);
    }
  }, [isVisible, autoClose, onClose]);

  const typeConfig = {
    success: {
      icon: <CheckCircle className="w-5 h-5 text-emerald-500" />,
      bg: 'bg-emerald-50',
      border: 'border-emerald-100',
      text: 'text-emerald-800'
    },
    warning: {
      icon: <Bell className="w-5 h-5 text-amber-500" />,
      bg: 'bg-amber-50',
      border: 'border-amber-100',
      text: 'text-amber-800'
    },
    error: {
      icon: <AlertCircle className="w-5 h-5 text-red-500" />,
      bg: 'bg-red-50',
      border: 'border-red-100',
      text: 'text-red-800'
    },
    info: {
      icon: <Info className="w-5 h-5 text-blue-500" />,
      bg: 'bg-blue-50',
      border: 'border-blue-100',
      text: 'text-blue-800'
    }
  };

  const config = typeConfig[type as keyof typeof typeConfig];

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          className={cn(
            "fixed top-6 right-6 z-50 p-4 rounded-2xl border shadow-lg max-w-md w-full",
            config.bg,
            config.border
          )}
        >
          <div className="flex gap-4">
            <div className="shrink-0">{config.icon}</div>
            <div className="flex-1">
              <h5 className={cn("text-sm font-bold", config.text)}>{title}</h5>
              <p className={cn("text-xs mt-1 leading-relaxed", config.text, "opacity-90")}>
                {message}
              </p>
            </div>
            <button 
              onClick={onClose}
              className="shrink-0 text-gray-400 hover:text-gray-600 transition-colors p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

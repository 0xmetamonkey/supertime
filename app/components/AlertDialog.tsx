'use client';

import React, { useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, AlertTriangle, CheckCircle, Info, X } from 'lucide-react';

interface AlertDialogProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  message?: string;
  buttonLabel?: string;
  variant?: 'info' | 'warning' | 'error' | 'success';
}

export default function AlertDialog({
  isOpen,
  onClose,
  title = 'Notification',
  message = '',
  buttonLabel = 'Got it',
  variant = 'info',
}: AlertDialogProps) {
  const closeRef = useRef<HTMLButtonElement>(null);

  // Focus the close button when the dialog opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => closeRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  const getIcon = () => {
    switch (variant) {
      case 'success':
        return <CheckCircle className="w-6 h-6 text-emerald-500" />;
      case 'warning':
        return <AlertTriangle className="w-6 h-6 text-amber-500" />;
      case 'error':
        return <AlertCircle className="w-6 h-6 text-red-500" />;
      case 'info':
      default:
        return <Info className="w-6 h-6 text-blue-500" />;
    }
  };

  const getIconBg = () => {
    switch (variant) {
      case 'success':
        return 'bg-emerald-50 dark:bg-emerald-950/40';
      case 'warning':
        return 'bg-amber-50 dark:bg-amber-950/40';
      case 'error':
        return 'bg-red-50 dark:bg-red-950/40';
      case 'info':
      default:
        return 'bg-blue-50 dark:bg-blue-950/40';
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Dialog */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="relative w-full max-w-sm bg-white dark:bg-surface border border-gray-200 dark:border-border rounded-2xl shadow-2xl overflow-hidden"
          >
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="p-6">
              {/* Icon */}
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${getIconBg()}`}>
                {getIcon()}
              </div>

              {/* Title */}
              <h3 className="text-lg font-semibold text-gray-900 dark:text-foreground mb-1.5">
                {title}
              </h3>

              {/* Message */}
              <p className="text-sm text-gray-500 dark:text-muted leading-relaxed whitespace-pre-wrap">
                {message}
              </p>
            </div>

            {/* Actions */}
            <div className="flex px-6 pb-6">
              <button
                ref={closeRef}
                onClick={onClose}
                className="w-full py-2.5 px-4 text-sm font-semibold rounded-xl bg-foreground text-background hover:opacity-90 transition-all focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              >
                {buttonLabel}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

// --- Hook for easy usage ---
interface AlertOptions {
  title?: string;
  message?: string;
  buttonLabel?: string;
  variant?: 'info' | 'warning' | 'error' | 'success';
}

export function useAlertDialog() {
  const [state, setState] = React.useState<{
    isOpen: boolean;
    options: AlertOptions;
    resolve: (() => void) | null;
  }>({
    isOpen: false,
    options: {},
    resolve: null,
  });

  const alert = useCallback((messageOrOptions: string | AlertOptions): Promise<void> => {
    const options: AlertOptions =
      typeof messageOrOptions === 'string'
        ? { message: messageOrOptions }
        : messageOrOptions;

    return new Promise((resolve) => {
      setState({ isOpen: true, options, resolve });
    });
  }, []);

  const handleClose = useCallback(() => {
    state.resolve?.();
    setState({ isOpen: false, options: {}, resolve: null });
  }, [state.resolve]);

  const dialog = (
    <AlertDialog
      isOpen={state.isOpen}
      onClose={handleClose}
      {...state.options}
    />
  );

  return { alert, AlertDialog: dialog };
}

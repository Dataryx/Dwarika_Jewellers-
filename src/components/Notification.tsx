import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, Check, X } from 'lucide-react';
import { useEffect } from 'react';

export type ToastChannel = 'store' | 'admin';
export type ToastVariant = 'success' | 'error' | 'info';

export type ToastPayload = { message: string; variant: ToastVariant };

interface NotificationProps {
  message: string;
  show: boolean;
  onClose: () => void;
  variant?: ToastVariant;
}

export default function Notification({
  message,
  show,
  onClose,
  variant = 'success',
}: NotificationProps) {
  useEffect(() => {
    if (show) {
      const timer = setTimeout(onClose, variant === 'error' ? 5000 : 3000);
      return () => clearTimeout(timer);
    }
  }, [show, onClose, variant]);

  const iconWrap =
    variant === 'error'
      ? 'bg-red-500/90'
      : variant === 'info'
        ? 'bg-slate-600'
        : 'bg-[#c9a962]';

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: -50, x: '-50%' }}
          animate={{ opacity: 1, y: 0, x: '-50%' }}
          exit={{ opacity: 0, y: -50, x: '-50%' }}
          className="fixed top-24 left-1/2 z-[60] bg-gray-900 text-white px-6 py-4 rounded-lg shadow-xl flex items-center gap-3 max-w-[min(92vw,28rem)]"
          role="status"
          aria-live="polite"
        >
          <div className={`w-6 h-6 ${iconWrap} rounded-full flex items-center justify-center shrink-0`}>
            {variant === 'error' ? (
              <AlertCircle className="w-4 h-4" />
            ) : (
              <Check className="w-4 h-4" />
            )}
          </div>
          <span className="text-sm font-medium">{message}</span>
          <button
            type="button"
            onClick={onClose}
            className="ml-2 text-white/60 hover:text-white transition-colors shrink-0"
            aria-label="Dismiss"
          >
            <X className="w-4 h-4" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

const callbacks: Partial<Record<ToastChannel, (payload: ToastPayload) => void>> = {};

export function setNotificationCallback(
  callback: (payload: ToastPayload) => void,
  channel: ToastChannel
) {
  callbacks[channel] = callback;
}

function emit(channel: ToastChannel, message: string, variant: ToastVariant = 'success') {
  const cb = callbacks[channel];
  if (cb) cb({ message, variant });
}

/** Storefront toasts only — never shown in admin. */
export function showStoreNotification(message: string, variant: ToastVariant = 'success') {
  emit('store', message, variant);
}

/** Admin panel toasts only — never shown on storefront. */
export function showAdminNotification(message: string, variant: ToastVariant = 'success') {
  emit('admin', message, variant);
}

/**
 * Storefront alias (keeps existing store imports working).
 * Admin code must use showAdminNotification.
 */
export function showNotification(message: string, variant: ToastVariant = 'success') {
  showStoreNotification(message, variant);
}

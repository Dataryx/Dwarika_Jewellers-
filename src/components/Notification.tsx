import { motion, AnimatePresence } from 'framer-motion';
import { Check, X } from 'lucide-react';
import { useState, useEffect } from 'react';

interface NotificationProps {
  message: string;
  show: boolean;
  onClose: () => void;
}

export default function Notification({ message, show, onClose }: NotificationProps) {
  useEffect(() => {
    if (show) {
      const timer = setTimeout(onClose, 3000);
      return () => clearTimeout(timer);
    }
  }, [show, onClose]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: -50, x: '-50%' }}
          animate={{ opacity: 1, y: 0, x: '-50%' }}
          exit={{ opacity: 0, y: -50, x: '-50%' }}
          className="fixed top-24 left-1/2 z-[60] bg-gray-900 text-white px-6 py-4 rounded-lg shadow-xl flex items-center gap-3"
        >
          <div className="w-6 h-6 bg-[#c9a962] rounded-full flex items-center justify-center">
            <Check className="w-4 h-4" />
          </div>
          <span className="text-sm font-medium">{message}</span>
          <button
            onClick={onClose}
            className="ml-2 text-white/60 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Toast store for global notifications
let notificationCallback: ((message: string) => void) | null = null;

export function setNotificationCallback(callback: (message: string) => void) {
  notificationCallback = callback;
}

export function showNotification(message: string) {
  if (notificationCallback) {
    notificationCallback(message);
  }
}

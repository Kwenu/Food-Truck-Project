import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { XIcon } from 'lucide-react';

interface SheetProps {
  open: boolean;
  onClose: () => void;
  title: string;
  /** Hide the visual title row (title is still used as the accessible name) */
  hideHeader?: boolean;
  children: React.ReactNode;
  footer?: React.ReactNode;
  variant?: 'dialog' | 'drawer';
  size?: 'md' | 'lg';
  tone?: 'light' | 'dark';
}

const ease = [0.23, 1, 0.32, 1] as const;

export function Sheet({ open, onClose, title, hideHeader = false, children, footer, variant = 'dialog', size = 'md', tone = 'light' }: SheetProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onCloseRef.current();
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const t = window.setTimeout(() => panelRef.current?.focus(), 10);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
      window.clearTimeout(t);
    };
  }, [open]);

  const isDrawer = variant === 'drawer';
  const width = isDrawer ? size === 'lg' ? 'md:max-w-2xl' : 'md:max-w-xl' : size === 'lg' ? 'md:max-w-2xl' : 'md:max-w-lg';
  const surface = tone === 'dark' ? 'bg-night-raised text-white' : 'bg-surface text-ink';

  return createPortal(
    <AnimatePresence>
      {open &&
      <div className={`fixed inset-0 z-50 flex items-end justify-center ${isDrawer ? 'md:items-stretch md:justify-end' : 'md:items-center md:p-6'}`}>
          <motion.div
          className="absolute inset-0 bg-ink/50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2, ease }}
          onClick={onClose} />
        
          <motion.div
          ref={panelRef}
          role="dialog"
          aria-modal="true"
          aria-label={title}
          tabIndex={-1}
          initial={isDrawer ? { opacity: 0, x: 32 } : { opacity: 0, y: 24, scale: 0.98 }}
          animate={isDrawer ? { opacity: 1, x: 0 } : { opacity: 1, y: 0, scale: 1 }}
          exit={isDrawer ? { opacity: 0, x: 32 } : { opacity: 0, y: 24, scale: 0.98 }}
          transition={{ duration: 0.25, ease }}
          className={`relative flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-3xl shadow-2xl outline-none ${surface} ${width} ${
          isDrawer ? 'md:h-full md:max-h-none md:rounded-none md:rounded-l-3xl' : 'md:rounded-3xl'}`
          }>
          
            {!hideHeader &&
          <div className={`flex items-center justify-between gap-4 border-b px-5 py-4 md:px-6 ${tone === 'dark' ? 'border-night-line' : 'border-line'}`}>
                <h2 className="font-display text-xl font-extrabold uppercase tracking-tight">{title}</h2>
                <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className={`grid h-10 w-10 place-items-center rounded-full transition-colors duration-150 ${tone === 'dark' ? 'hover:bg-night-line' : 'hover:bg-cream'}`}>
              
                  <XIcon size={20} />
                </button>
              </div>
          }
            {hideHeader &&
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="absolute right-3 top-3 z-10 grid h-10 w-10 place-items-center rounded-full bg-surface/95 text-ink shadow-md transition-colors duration-150 hover:bg-surface">
            
                <XIcon size={20} />
              </button>
          }
            <div className="flex-1 overflow-y-auto">{children}</div>
            {footer && <div className={`border-t px-5 py-4 md:px-6 ${tone === 'dark' ? 'border-night-line' : 'border-line'}`}>{footer}</div>}
          </motion.div>
        </div>
      }
    </AnimatePresence>,
    document.body
  );
}
'use client'

import React, {
  useRef,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react'

// ---------------------------------------------------------------------------
// Utility
// ---------------------------------------------------------------------------
function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ')
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export type ModalSize = 'sm' | 'md' | 'lg' | 'xl'

export interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  description?: string
  /** Content rendered in the modal body */
  children?: ReactNode
  /** Content rendered in the modal footer (overrides default close) */
  footer?: ReactNode
  size?: ModalSize
  /** Prevent closing by clicking backdrop */
  preventBackdropClose?: boolean
  className?: string
}

// ---------------------------------------------------------------------------
// Size map
// ---------------------------------------------------------------------------
const sizeClasses: Record<ModalSize, string> = {
  sm: 'w-full max-w-sm',
  md: 'w-full max-w-md',
  lg: 'w-full max-w-lg',
  xl: 'w-full max-w-2xl',
}

// ---------------------------------------------------------------------------
// Close icon
// ---------------------------------------------------------------------------
function XIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn('h-5 w-5', className)}
      aria-hidden="true"
    >
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  )
}

// ---------------------------------------------------------------------------
// Modal
// ---------------------------------------------------------------------------
export function Modal({
  isOpen,
  onClose,
  title,
  description,
  children,
  footer,
  size = 'md',
  preventBackdropClose = false,
  className,
}: ModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)

  // Open / close the native dialog
  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return

    if (isOpen) {
      if (!dialog.open) {
        dialog.showModal()
        document.body.style.overflow = 'hidden'
      }
    } else {
      if (dialog.open) {
        dialog.close()
        document.body.style.overflow = ''
      }
    }
  }, [isOpen])

  // Sync native close event (e.g. Escape key)
  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    const handleCancel = (e: Event) => {
      e.preventDefault()
      onClose()
    }
    dialog.addEventListener('cancel', handleCancel)
    return () => dialog.removeEventListener('cancel', handleCancel)
  }, [onClose])

  // Close on backdrop click
  const handleDialogClick = useCallback(
    (e: React.MouseEvent<HTMLDialogElement>) => {
      if (preventBackdropClose) return
      const rect = dialogRef.current?.getBoundingClientRect()
      if (!rect) return
      const clickedOutside =
        e.clientX < rect.left ||
        e.clientX > rect.right ||
        e.clientY < rect.top ||
        e.clientY > rect.bottom
      if (clickedOutside) onClose()
    },
    [onClose, preventBackdropClose]
  )

  return (
    <dialog
      ref={dialogRef}
      onClick={handleDialogClick}
      className={cn(
        // Reset native dialog styles
        'p-0 m-auto bg-transparent',
        'overflow-visible outline-none',
        // Backdrop
        'backdrop:bg-[#0F1C3F]/60 backdrop:backdrop-blur-sm',
        // Animate
        'open:animate-[modalIn_200ms_ease-out]',
        sizeClasses[size],
        className
      )}
      aria-modal="true"
      aria-labelledby={title ? 'modal-title' : undefined}
      aria-describedby={description ? 'modal-description' : undefined}
    >
      <style>{`
        @keyframes modalIn {
          from { opacity: 0; transform: scale(0.96) translateY(-8px); }
          to   { opacity: 1; transform: scale(1)    translateY(0); }
        }
      `}</style>

      {/* Panel */}
      <div
        className="bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        {(title || description) && (
          <div className="flex items-start justify-between gap-4 px-6 py-5 border-b border-slate-100">
            <div className="flex-1 min-w-0">
              {title && (
                <h2
                  id="modal-title"
                  className="text-lg font-semibold text-[#0F1C3F] leading-snug"
                >
                  {title}
                </h2>
              )}
              {description && (
                <p
                  id="modal-description"
                  className="mt-1 text-sm text-slate-500"
                >
                  {description}
                </p>
              )}
            </div>

            <button
              type="button"
              onClick={onClose}
              className={cn(
                'shrink-0 rounded-lg p-1.5 text-slate-400',
                'hover:text-[#0F1C3F] hover:bg-slate-100',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F1C3F]',
                'transition-colors duration-150'
              )}
              aria-label="Close dialog"
            >
              <XIcon />
            </button>
          </div>
        )}

        {/* Close button when no header */}
        {!title && !description && (
          <div className="flex justify-end px-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className={cn(
                'rounded-lg p-1.5 text-slate-400',
                'hover:text-[#0F1C3F] hover:bg-slate-100',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F1C3F]',
                'transition-colors duration-150'
              )}
              aria-label="Close dialog"
            >
              <XIcon />
            </button>
          </div>
        )}

        {/* Body */}
        {children && (
          <div className="px-6 py-5 flex-1 overflow-y-auto">{children}</div>
        )}

        {/* Footer */}
        {footer && (
          <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-end gap-3">
            {footer}
          </div>
        )}
      </div>
    </dialog>
  )
}

export default Modal

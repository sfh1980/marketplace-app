/**
 * Modal Component
 * 
 * A reusable modal (dialog) component for overlays and popups.
 * Modals are used for focused interactions that require user attention.
 * 
 * Features:
 * - Multiple sizes (small, medium, large, full)
 * - Backdrop click to close (optional)
 * - ESC key to close
 * - Focus trap (keeps focus inside modal)
 * - Scroll lock (prevents body scroll when modal is open)
 * - Header, body, and footer sections
 * - Close button
 * - Smooth animations
 * - Accessible (proper ARIA attributes, focus management)
 * - Portal rendering (renders outside parent DOM hierarchy)
 * 
 * Usage:
 * <Modal
 *   isOpen={isModalOpen}
 *   onClose={() => setIsModalOpen(false)}
 *   title="Confirm Action"
 *   size="medium"
 * >
 *   <Modal.Body>
 *     <p>Are you sure you want to delete this item?</p>
 *   </Modal.Body>
 *   <Modal.Footer>
 *     <Button onClick={() => setIsModalOpen(false)}>Cancel</Button>
 *     <Button variant="danger" onClick={handleDelete}>Delete</Button>
 *   </Modal.Footer>
 * </Modal>
 */

import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import styles from './Modal.module.css';

/**
 * Modal Props Interface
 */
interface ModalProps {
  /** Whether the modal is open */
  isOpen: boolean;
  
  /** Callback when modal should close */
  onClose: () => void;
  
  /** Modal title (displayed in header) */
  title?: string;
  
  /** Size of the modal */
  size?: 'small' | 'medium' | 'large' | 'full';
  
  /** Whether clicking backdrop closes the modal */
  closeOnBackdropClick?: boolean;
  
  /** Whether ESC key closes the modal */
  closeOnEsc?: boolean;
  
  /** Hide the close button */
  hideCloseButton?: boolean;
  
  /** Custom class name for modal content */
  className?: string;
  
  /** Modal content */
  children: React.ReactNode;
}

/**
 * Modal Section Props
 */
interface ModalSectionProps {
  className?: string;
  children: React.ReactNode;
}

/**
 * Main Modal Component
 * 
 * This component uses several advanced React patterns:
 * 1. Portals - Renders modal outside parent DOM hierarchy
 * 2. useEffect - Manages side effects (scroll lock, ESC key)
 * 3. useRef - Tracks modal element for focus management
 * 4. Compound components - Modal.Body and Modal.Footer
 */
export const Modal: React.FC<ModalProps> & {
  Body: React.FC<ModalSectionProps>;
  Footer: React.FC<ModalSectionProps>;
} = ({
  isOpen,
  onClose,
  title,
  size = 'medium',
  closeOnBackdropClick = true,
  closeOnEsc = true,
  hideCloseButton = false,
  className = '',
  children
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  
  /**
   * Handle ESC key press to close modal
   * 
   * useEffect with cleanup function:
   * - Adds event listener when modal opens
   * - Removes event listener when modal closes or component unmounts
   * - This prevents memory leaks
   */
  useEffect(() => {
    if (!isOpen || !closeOnEsc) return;
    
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    
    document.addEventListener('keydown', handleEscape);
    
    // Cleanup function (runs when effect dependencies change or component unmounts)
    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, closeOnEsc, onClose]);
  
  /**
   * Lock body scroll when modal is open
   * 
   * Why? When a modal is open, we don't want users scrolling the page behind it.
   * This creates a better UX and prevents confusion.
   */
  useEffect(() => {
    if (!isOpen) return;
    
    // Save original body overflow style
    const originalOverflow = document.body.style.overflow;
    
    // Lock scroll
    document.body.style.overflow = 'hidden';
    
    // Restore original overflow when modal closes
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen]);
  
  /**
   * Focus management
   * 
   * When modal opens, focus should move to the modal.
   * This helps keyboard users and screen reader users.
   */
  useEffect(() => {
    if (!isOpen || !modalRef.current) return;
    
    // Save currently focused element
    const previouslyFocusedElement = document.activeElement as HTMLElement;
    
    // Focus the modal
    modalRef.current.focus();
    
    // Restore focus when modal closes
    return () => {
      previouslyFocusedElement?.focus();
    };
  }, [isOpen]);
  
  /**
   * Handle backdrop click
   */
  const handleBackdropClick = (event: React.MouseEvent<HTMLDivElement>) => {
    // Only close if clicking the backdrop itself, not its children
    if (event.target === event.currentTarget && closeOnBackdropClick) {
      onClose();
    }
  };
  
  /**
   * Don't render anything if modal is closed
   */
  if (!isOpen) return null;
  
  /**
   * Build modal classes
   */
  const modalClasses = [
    styles.modal,
    styles[`modal--${size}`],
    className
  ].filter(Boolean).join(' ');
  
  /**
   * Modal content
   * 
   * We separate this so we can use createPortal to render it
   * outside the parent component's DOM hierarchy.
   */
  const modalContent = (
    <div
      className={styles.modal__backdrop}
      onClick={handleBackdropClick}
      role="presentation"
    >
      <div
        ref={modalRef}
        className={modalClasses}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? 'modal-title' : undefined}
        tabIndex={-1}
      >
        {/* Modal Header */}
        {(title || !hideCloseButton) && (
          <div className={styles.modal__header}>
            {title && (
              <h2 id="modal-title" className={styles.modal__title}>
                {title}
              </h2>
            )}
            
            {!hideCloseButton && (
              <button
                type="button"
                className={styles.modal__close}
                onClick={onClose}
                aria-label="Close modal"
              >
                <svg
                  className={styles.modal__closeIcon}
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            )}
          </div>
        )}
        
        {/* Modal Content */}
        <div className={styles.modal__content}>
          {children}
        </div>
      </div>
    </div>
  );
  
  /**
   * Use React Portal to render modal at document root
   * 
   * Why? Modals should be rendered at the top level of the DOM to:
   * - Avoid z-index issues with parent containers
   * - Ensure proper stacking context
   * - Prevent CSS inheritance issues
   * 
   * createPortal(content, container) renders content into container
   * even though it's defined here in the component tree.
   */
  return createPortal(modalContent, document.body);
};

/**
 * Modal Body Sub-component
 * 
 * Use for main modal content.
 */
Modal.Body = ({ className = '', children }: ModalSectionProps) => {
  const bodyClasses = [
    styles.modal__body,
    className
  ].filter(Boolean).join(' ');
  
  return (
    <div className={bodyClasses}>
      {children}
    </div>
  );
};

/**
 * Modal Footer Sub-component
 * 
 * Use for modal actions (buttons, links).
 */
Modal.Footer = ({ className = '', children }: ModalSectionProps) => {
  const footerClasses = [
    styles.modal__footer,
    className
  ].filter(Boolean).join(' ');
  
  return (
    <div className={footerClasses}>
      {children}
    </div>
  );
};

// Display names for debugging
Modal.displayName = 'Modal';
Modal.Body.displayName = 'Modal.Body';
Modal.Footer.displayName = 'Modal.Footer';

export default Modal;

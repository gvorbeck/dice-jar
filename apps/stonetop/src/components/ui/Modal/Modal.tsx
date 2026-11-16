import type { ReactNode } from 'react';
import { Dialog, Modal as AriaModal, ModalOverlay } from 'react-aria-components';
import { cn } from '@dice-jar/cn';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  className?: string;
  'aria-labelledby': string;
}

// React Aria supplies the focus trap, Escape and outside-click dismissal, scroll lock and focus return.
export const Modal = ({ open, onClose, children, className, 'aria-labelledby': labelledBy }: ModalProps) => (
  <ModalOverlay
    isOpen={open}
    onOpenChange={(next) => {
      if (!next) onClose();
    }}
    isDismissable
    className="modal-backdrop"
  >
    <AriaModal className={cn('modal-panel field-focus-visible', className)}>
      <Dialog aria-labelledby={labelledBy} className="modal-dialog">
        {children}
      </Dialog>
    </AriaModal>
  </ModalOverlay>
);

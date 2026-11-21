import type { ReactNode } from 'react';
import { Dialog, Heading, Modal as AriaModal, ModalOverlay } from 'react-aria-components';
import { Button } from '@/components/ui';
import './Modal.css';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg';
}

// React Aria supplies the focus trap, Escape and outside-click dismissal, scroll lock and focus return.
export default function Modal({ isOpen, onClose, title, children, size = 'md' }: ModalProps) {
  return (
    <ModalOverlay
      isOpen={isOpen}
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
      isDismissable
      className="modal-backdrop"
    >
      <AriaModal className="modal-panel" data-size={size}>
        <Dialog className="modal-dialog">
          <div className="modal-header">
            <Heading slot="title" className="modal-title">
              {title}
            </Heading>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              aria-label="Close modal"
              className="modal-close"
              icon="close"
              iconSize="lg"
            />
          </div>
          <div className="modal-body">{children}</div>
        </Dialog>
      </AriaModal>
    </ModalOverlay>
  );
}

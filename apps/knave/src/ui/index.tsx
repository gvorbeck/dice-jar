import {
  Button,
  Checkbox,
  Dialog,
  Heading,
  Input,
  Label,
  Modal,
  ModalOverlay,
  NumberField,
  TextArea,
  TextField,
} from 'react-aria-components';
import { useId, type ReactNode } from 'react';
import { MAX_LINE, MAX_PROSE, type Character } from '@/model/character';
import { cn } from '@dice-jar/cn';

export type Up = (fn: (draft: Character) => void) => void;

export const Btn = ({
  children,
  onPress,
  disabled,
  className,
  label,
}: {
  children: ReactNode;
  onPress: () => void;
  disabled?: boolean;
  className?: string;
  label?: string;
}) => (
  <Button className={cn('btn', className)} onPress={onPress} isDisabled={disabled} aria-label={label}>
    {children}
  </Button>
);

/** `max` matches the character schema: a line or a text area, unless given. */
export const Text = ({
  label,
  value,
  onChange,
  area,
  max = area ? MAX_PROSE : MAX_LINE,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  area?: boolean;
  max?: number;
}) => (
  <TextField className="field" value={value} onChange={onChange} maxLength={max}>
    <Label>{label}</Label>
    {area ? <TextArea /> : <Input />}
  </TextField>
);

export const Num = ({ label, value, onChange, max }: { label: string; value: number; onChange: (v: number) => void; max: number }) => (
  <NumberField className="field" value={value} minValue={0} maxValue={max} onChange={(v) => Number.isFinite(v) && onChange(v)}>
    <Label>{label}</Label>
    <Input />
  </NumberField>
);

/** A labelled number with − and + buttons. `note` is announced with the group. */
export function Counter({
  label,
  note,
  value,
  min = 0,
  max,
  warn,
  onChange,
}: {
  label: string;
  note?: string;
  value: number;
  min?: number;
  max: number;
  warn?: boolean;
  onChange: (v: number) => void;
}) {
  const noteId = useId();
  return (
    <div className="counter" role="group" aria-label={label} aria-describedby={note ? noteId : undefined}>
      <strong>{label}</strong>
      <Btn label={`Decrease ${label}`} disabled={value <= min} onPress={() => onChange(value - 1)}>
        −
      </Btn>
      <output className={warn ? 'warn' : undefined}>{value}</output>
      <Btn label={`Increase ${label}`} disabled={value >= max} onPress={() => onChange(value + 1)}>
        +
      </Btn>
      {note && (
        <span className="dim" id={noteId}>
          {note}
        </span>
      )}
    </div>
  );
}

/** Name and description, as the creator's last step and the sheet both ask for them. */
export const DetailFields = ({ c, up }: { c: Character; up: Up }) => (
  <>
    <Text label="Name" value={c.name} onChange={(v) => up((d) => void (d.name = v))} />
    <Text label="Description" area value={c.description} onChange={(v) => up((d) => void (d.description = v))} />
  </>
);

/** A checkbox that reads as a line of the sheet. */
export const Check = ({ selected, onChange, children }: { selected: boolean; onChange: (v: boolean) => void; children: ReactNode }) => (
  <Checkbox className="choice" isSelected={selected} onChange={onChange}>
    <span className="mark" />
    {children}
  </Checkbox>
);

/** A native select, labelled for screen readers. */
export function Select({
  label,
  value,
  onChange,
  disabled,
  children,
}: {
  label: string;
  value: string | number;
  onChange: (v: string) => void;
  disabled?: boolean;
  children: ReactNode;
}) {
  return (
    <select aria-label={label} value={value} disabled={disabled} onChange={(e) => onChange(e.target.value)}>
      {children}
    </select>
  );
}

/** In-page replacement for window.confirm(): focus is trapped, Escape and a click outside cancel. */
export const ConfirmDialog = ({
  title,
  children,
  confirm,
  onConfirm,
  onClose,
}: {
  title: string;
  children: ReactNode;
  confirm: string;
  onConfirm: () => void;
  onClose: () => void;
}) => (
  <ModalOverlay
    isOpen
    onOpenChange={(o) => {
      if (!o) onClose();
    }}
    isDismissable
    className="overlay"
  >
    <Modal className="modal">
      <Dialog role="alertdialog" className="dialog">
        <Heading slot="title">{title}</Heading>
        <p>{children}</p>
        <div className="row">
          <Btn
            className="primary"
            onPress={() => {
              onClose();
              onConfirm();
            }}
          >
            {confirm}
          </Btn>
          <Btn onPress={onClose}>Cancel</Btn>
        </div>
      </Dialog>
    </Modal>
  </ModalOverlay>
);

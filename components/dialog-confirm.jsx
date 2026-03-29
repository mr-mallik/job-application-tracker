'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertTriangle } from 'lucide-react';
import { useState } from 'react';

/**
 * Confirmation Dialog Component
 *
 * @param {boolean} open - Dialog open state
 * @param {function} onOpenChange - Callback when dialog open state changes
 * @param {string} title - Dialog title
 * @param {string} description - Dialog description text
 * @param {string} confirmText - Confirm button text (default: "Confirm")
 * @param {string} cancelText - Cancel button text (default: "Cancel")
 * @param {function} onConfirm - Callback when confirmed
 * @param {function} onCancel - Callback when cancelled
 * @param {string} variant - Button variant: "default" | "destructive" (default: "default")
 * @param {boolean} destructive - Shorthand for variant="destructive"
 */
export function ConfirmDialog({
  open,
  onOpenChange,
  title = 'Are you sure?',
  description,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
  variant = 'default',
  destructive = false,
}) {
  const handleConfirm = () => {
    onConfirm?.();
    onOpenChange?.(false);
  };

  const handleCancel = () => {
    onCancel?.();
    onOpenChange?.(false);
  };

  const buttonVariant = destructive ? 'destructive' : variant;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {destructive && <AlertTriangle className="w-5 h-5 text-destructive" />}
            {title}
          </DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" size="sm" onClick={handleCancel}>
            {cancelText}
          </Button>
          <Button variant={buttonVariant} size="sm" onClick={handleConfirm}>
            {confirmText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Prompt Dialog Component - accepts text input
 *
 * @param {boolean} open - Dialog open state
 * @param {function} onOpenChange - Callback when dialog open state changes
 * @param {string} title - Dialog title
 * @param {string} description - Dialog description text
 * @param {string} label - Input label
 * @param {string} placeholder - Input placeholder
 * @param {string} defaultValue - Default input value
 * @param {string} confirmText - Confirm button text (default: "Submit")
 * @param {string} cancelText - Cancel button text (default: "Cancel")
 * @param {function} onConfirm - Callback when confirmed (receives input value)
 * @param {function} onCancel - Callback when cancelled
 */
export function PromptDialog({
  open,
  onOpenChange,
  title = 'Enter value',
  description,
  label,
  placeholder = '',
  defaultValue = '',
  confirmText = 'Submit',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
}) {
  const [value, setValue] = useState(defaultValue);

  const handleConfirm = () => {
    onConfirm?.(value);
    onOpenChange?.(false);
    setValue(defaultValue);
  };

  const handleCancel = () => {
    onCancel?.();
    onOpenChange?.(false);
    setValue(defaultValue);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) handleCancel();
        else onOpenChange?.(isOpen);
      }}
    >
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        <div className="space-y-2">
          {label && <Label htmlFor="prompt-input">{label}</Label>}
          <Input
            id="prompt-input"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={placeholder}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleConfirm();
              }
            }}
            autoFocus
          />
        </div>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" size="sm" onClick={handleCancel}>
            {cancelText}
          </Button>
          <Button size="sm" onClick={handleConfirm}>
            {confirmText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Hook for using confirmation dialogs imperatively
 *
 * Usage:
 * const confirm = useConfirm();
 *
 * const handleDelete = async () => {
 *   const confirmed = await confirm({
 *     title: 'Delete item?',
 *     description: 'This action cannot be undone.',
 *     destructive: true,
 *   });
 *   if (confirmed) {
 *     // do deletion
 *   }
 * };
 */
export function useConfirm() {
  const [state, setState] = useState({ open: false, resolve: null, config: {} });

  const confirm = (config) => {
    return new Promise((resolve) => {
      setState({ open: true, resolve, config });
    });
  };

  const handleConfirm = () => {
    state.resolve?.(true);
    setState({ open: false, resolve: null, config: {} });
  };

  const handleCancel = () => {
    state.resolve?.(false);
    setState({ open: false, resolve: null, config: {} });
  };

  const ConfirmDialogComponent = () => (
    <ConfirmDialog
      open={state.open}
      onOpenChange={(open) => {
        if (!open) handleCancel();
      }}
      onConfirm={handleConfirm}
      onCancel={handleCancel}
      {...state.config}
    />
  );

  return { confirm, ConfirmDialog: ConfirmDialogComponent };
}

/**
 * Hook for using prompt dialogs imperatively
 *
 * Usage:
 * const prompt = usePrompt();
 *
 * const handleRename = async () => {
 *   const newName = await prompt({
 *     title: 'Rename file',
 *     label: 'New name',
 *     defaultValue: currentName,
 *   });
 *   if (newName) {
 *     // do rename
 *   }
 * };
 */
export function usePrompt() {
  const [state, setState] = useState({ open: false, resolve: null, config: {} });

  const prompt = (config) => {
    return new Promise((resolve) => {
      setState({ open: true, resolve, config });
    });
  };

  const handleConfirm = (value) => {
    state.resolve?.(value);
    setState({ open: false, resolve: null, config: {} });
  };

  const handleCancel = () => {
    state.resolve?.(null);
    setState({ open: false, resolve: null, config: {} });
  };

  const PromptDialogComponent = () => (
    <PromptDialog
      open={state.open}
      onOpenChange={(open) => {
        if (!open) handleCancel();
      }}
      onConfirm={handleConfirm}
      onCancel={handleCancel}
      {...state.config}
    />
  );

  return { prompt, PromptDialog: PromptDialogComponent };
}

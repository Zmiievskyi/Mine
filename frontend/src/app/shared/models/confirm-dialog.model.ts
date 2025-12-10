/**
 * Data interface for confirmation dialogs
 * Used across admin components for delete/action confirmations
 */
export interface ConfirmDialogData {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'default' | 'destructive';
}

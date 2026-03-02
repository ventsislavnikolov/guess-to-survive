import { createContext } from "react";

export interface ConfirmDialogOptions {
  cancelText?: string;
  confirmText?: string;
  description?: string;
  title: string;
  variant?: "default" | "destructive";
}

export interface ConfirmDialogContextValue {
  confirm: (options: ConfirmDialogOptions) => Promise<boolean>;
}

export const ConfirmDialogContext = createContext<
  ConfirmDialogContextValue | undefined
>(undefined);

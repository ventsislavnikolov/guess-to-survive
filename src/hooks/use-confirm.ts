import { useContext } from "react";

import { ConfirmDialogContext } from "@/contexts/confirm-dialog-context";

export function useConfirm() {
  const context = useContext(ConfirmDialogContext);

  if (!context) {
    throw new Error("useConfirm must be used within a ConfirmDialogProvider");
  }

  return context.confirm;
}

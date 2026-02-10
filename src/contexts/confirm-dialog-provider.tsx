import type * as React from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  ConfirmDialogContext,
  type ConfirmDialogOptions,
} from "@/contexts/confirm-dialog-context";

interface ConfirmDialogProviderProps {
  children: React.ReactNode;
}

export function ConfirmDialogProvider({
  children,
}: ConfirmDialogProviderProps) {
  const [open, setOpen] = useState(false);
  const [options, setOptions] = useState<ConfirmDialogOptions | null>(null);
  const resolverRef = useRef<((value: boolean) => void) | null>(null);

  const resolveOutstanding = useCallback((value: boolean) => {
    const resolve = resolverRef.current;
    if (!resolve) {
      return;
    }

    resolverRef.current = null;
    resolve(value);
  }, []);

  const close = useCallback(
    (value: boolean) => {
      resolveOutstanding(value);
      setOpen(false);
      setOptions(null);
    },
    [resolveOutstanding]
  );

  const confirm = useCallback(
    (nextOptions: ConfirmDialogOptions) => {
      // Ensure any previous confirm does not hang forever.
      resolveOutstanding(false);

      setOptions(nextOptions);
      setOpen(true);

      return new Promise<boolean>((resolve) => {
        resolverRef.current = resolve;
      });
    },
    [resolveOutstanding]
  );

  useEffect(() => {
    return () => {
      resolveOutstanding(false);
    };
  }, [resolveOutstanding]);

  const value = useMemo(() => ({ confirm }), [confirm]);
  const confirmVariant =
    options?.variant === "destructive" ? "destructive" : "default";

  return (
    <ConfirmDialogContext.Provider value={value}>
      {children}
      <AlertDialog
        onOpenChange={(nextOpen) => {
          if (nextOpen) {
            setOpen(true);
          } else {
            close(false);
          }
        }}
        open={open}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{options?.title ?? ""}</AlertDialogTitle>
            {options?.description ? (
              <AlertDialogDescription>
                {options.description}
              </AlertDialogDescription>
            ) : null}
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => close(false)}>
              {options?.cancelText ?? "Cancel"}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => close(true)}
              variant={confirmVariant}
            >
              {options?.confirmText ?? "Continue"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </ConfirmDialogContext.Provider>
  );
}

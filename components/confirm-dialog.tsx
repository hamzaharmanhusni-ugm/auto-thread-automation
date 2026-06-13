"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

/** Confirmation dialog for destructive/irreversible actions. Always ask before deleting. */
export function ConfirmDialog({
  trigger,
  title,
  description,
  confirmLabel = "Hapus",
  successMessage = "Berhasil.",
  action,
  onSuccess,
  confirmVariant = "destructive",
  open: openProp,
  onOpenChange,
}: {
  trigger?: React.ReactNode;
  title: string;
  description: React.ReactNode;
  confirmLabel?: string;
  successMessage?: string;
  action: () => Promise<{ ok: boolean; error?: string }>;
  onSuccess?: () => void;
  confirmVariant?: "destructive" | "default";
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const router = useRouter();
  const [openState, setOpenState] = useState(false);
  const controlled = openProp !== undefined;
  const open = controlled ? openProp : openState;
  const setOpen = (o: boolean) => (controlled ? onOpenChange?.(o) : setOpenState(o));
  const [pending, start] = useTransition();

  function confirm() {
    start(async () => {
      const res = await action();
      if (res.ok) {
        toast.success(successMessage);
        setOpen(false);
        onSuccess?.();
        router.refresh();
      } else {
        toast.error(res.error ?? "Gagal.");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger ? <DialogTrigger asChild>{trigger}</DialogTrigger> : null}
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="ghost" disabled={pending}>
              Batal
            </Button>
          </DialogClose>
          <Button variant={confirmVariant} onClick={confirm} disabled={pending}>
            {pending ? <Loader2 className="size-4 animate-spin" /> : null}
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

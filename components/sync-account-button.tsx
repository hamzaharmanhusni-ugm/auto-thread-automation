"use client";

import { useTransition } from "react";
import { RefreshCw, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { syncAccounts } from "@/app/(app)/akun/actions";

export function SyncAccountButton() {
  const [pending, startTransition] = useTransition();

  function onClick() {
    startTransition(async () => {
      const res = await syncAccounts();
      if (res.ok) toast.success(`Sinkron selesai — ${res.synced ?? 0} akun.`);
      else toast.error(res.error ?? "Gagal sinkronisasi.");
    });
  }

  return (
    <Button onClick={onClick} disabled={pending}>
      {pending ? <Loader2 className="size-4 animate-spin" /> : <RefreshCw className="size-4" />}
      Sinkronkan Akun
    </Button>
  );
}

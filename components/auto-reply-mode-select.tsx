"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { setAccountReplyMode } from "@/app/(app)/komentar/actions";
import { ConfirmDialog } from "@/components/confirm-dialog";
import type { Enums } from "@/lib/database.types";

type Mode = Enums<"auto_reply_mode_t">;

const MODES: { v: Mode; l: string }[] = [
  { v: "manual", l: "Manual" },
  { v: "semi_auto", l: "Semi Otomatis" },
  { v: "full_auto", l: "Otomatis Penuh" },
];

export function AutoReplyModeSelect({ accountId, value }: { accountId: string; value: string }) {
  const [val, setVal] = useState<Mode>(value as Mode);
  const [pending, start] = useTransition();
  const [confirmOpen, setConfirmOpen] = useState(false);

  function apply(mode: Mode) {
    start(async () => {
      const r = await setAccountReplyMode(accountId, mode);
      if (r.ok) {
        setVal(mode);
        toast.success("Mode balas diperbarui.");
      } else {
        toast.error(r.error ?? "Gagal mengubah mode.");
      }
    });
  }

  return (
    <>
      <select
        value={val}
        disabled={pending}
        aria-label="Mode balas otomatis"
        onChange={(e) => {
          const mode = e.target.value as Mode;
          if (mode === "full_auto") setConfirmOpen(true);
          else apply(mode);
        }}
        className="h-8 rounded-md border bg-background px-2 text-xs outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:opacity-60"
      >
        {MODES.map((m) => (
          <option key={m.v} value={m.v}>
            {m.l}
          </option>
        ))}
      </select>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Nyalakan balasan otomatis penuh?"
        description="AI akan membalas komentar publik tanpa persetujuanmu lebih dulu. Cocok kalau kamu sudah percaya hasilnya. Kamu bisa mematikannya kapan saja."
        confirmLabel="Ya, nyalakan"
        confirmVariant="default"
        successMessage="Mode Otomatis Penuh aktif."
        action={() => setAccountReplyMode(accountId, "full_auto")}
        onSuccess={() => setVal("full_auto")}
      />
    </>
  );
}

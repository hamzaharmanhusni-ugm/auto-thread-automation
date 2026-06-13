"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { setAccountReplyMode } from "@/app/(app)/komentar/actions";
import type { Enums } from "@/lib/database.types";

const MODES: { v: Enums<"auto_reply_mode_t">; l: string }[] = [
  { v: "manual", l: "Manual" },
  { v: "semi_auto", l: "Semi Otomatis" },
  { v: "full_auto", l: "Otomatis Penuh" },
];

export function AutoReplyModeSelect({ accountId, value }: { accountId: string; value: string }) {
  const [pending, start] = useTransition();
  return (
    <select
      value={value}
      disabled={pending}
      aria-label="Mode balas otomatis"
      onChange={(e) => {
        const mode = e.target.value as Enums<"auto_reply_mode_t">;
        start(async () => {
          const r = await setAccountReplyMode(accountId, mode);
          if (r.ok) toast.success("Mode balas diperbarui.");
          else toast.error(r.error ?? "Gagal mengubah mode.");
        });
      }}
      className="h-8 rounded-md border bg-background px-2 text-xs outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:opacity-60"
    >
      {MODES.map((m) => (
        <option key={m.v} value={m.v}>
          {m.l}
        </option>
      ))}
    </select>
  );
}

"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, MessagesSquare } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { seedInterAccountComments, scheduleInterAccountComments } from "./content-actions";

export function SeedCommentsDialog({
  contentId,
  defaultCount,
  open,
  onOpenChange,
}: {
  contentId: string;
  defaultCount: number;
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  const router = useRouter();
  const [count, setCount] = useState(Math.max(1, defaultCount || 2));
  const [mode, setMode] = useState<"now" | "scheduled">("scheduled");
  const [pending, start] = useTransition();

  function run() {
    start(async () => {
      if (mode === "scheduled") {
        const res = await scheduleInterAccountComments(contentId, count);
        if (res.ok) {
          toast.success(`${res.planned} komentar dijadwalkan dengan jeda acak yang natural.`);
          onOpenChange(false);
          router.refresh();
        } else {
          toast.error(res.error ?? "Gagal menjadwalkan komentar.");
        }
        return;
      }
      const res = await seedInterAccountComments(contentId, count);
      if (res.ok) {
        toast.success(`${res.posted} akun berkomentar di konten ini.`);
        onOpenChange(false);
        router.refresh();
      } else {
        toast.error(res.error ?? "Gagal mengirim komentar.");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Komentar antar akun</DialogTitle>
          <DialogDescription>
            Akun lain yang terhubung di Repliz akan meninggalkan komentar singkat di konten ini untuk menambah
            engagement. Komentar dibuat AI sesuai persona tiap akun (atau memakai komentar pemicu konten).
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="seed-count">Berapa akun yang ikut komentar?</Label>
            <Input
              id="seed-count"
              type="number"
              min={1}
              max={20}
              value={count}
              onChange={(e) => setCount(Number(e.target.value))}
              className="w-28 tabular-nums"
            />
            <p className="text-xs text-muted-foreground">
              Angka default mengikuti pengaturan &ldquo;Akun auto-comment&rdquo; di Pengaturan.
            </p>
          </div>

          <div className="space-y-1.5">
            <Label>Waktu kirim</Label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setMode("scheduled")}
                className={`flex-1 rounded-lg border px-3 py-2 text-left text-sm transition ${
                  mode === "scheduled" ? "border-primary bg-primary/5 ring-1 ring-primary" : "hover:bg-accent"
                }`}
              >
                <span className="font-medium">Jeda natural</span>
                <span className="block text-xs text-muted-foreground">Acak, menyusul beberapa menit (disarankan)</span>
              </button>
              <button
                type="button"
                onClick={() => setMode("now")}
                className={`flex-1 rounded-lg border px-3 py-2 text-left text-sm transition ${
                  mode === "now" ? "border-primary bg-primary/5 ring-1 ring-primary" : "hover:bg-accent"
                }`}
              >
                <span className="font-medium">Kirim sekarang</span>
                <span className="block text-xs text-muted-foreground">Langsung semua sekaligus</span>
              </button>
            </div>
            {mode === "scheduled" ? (
              <p className="text-xs text-muted-foreground">
                Butuh cron aktif untuk mengirim otomatis (lihat Panduan). Jeda mengikuti setelan di Pengaturan.
              </p>
            ) : null}
          </div>
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="ghost" disabled={pending}>
              Batal
            </Button>
          </DialogClose>
          <Button onClick={run} disabled={pending}>
            {pending ? <Loader2 className="size-4 animate-spin" /> : <MessagesSquare className="size-4" />}
            {mode === "scheduled" ? "Jadwalkan komentar" : "Kirim sekarang"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

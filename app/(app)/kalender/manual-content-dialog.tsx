"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Sparkles, PenLine, Save } from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { HelpTip } from "@/components/help-tip";
import { wibToUtcIso } from "@/lib/date";
import { generateBodyForAccount, createManualContent } from "./actions";

export type GenAccount = { id: string; username: string | null; hasPersona: boolean };

export function ManualContentDialog({
  accounts,
  open,
  onOpenChange,
  presetDateKey,
}: {
  accounts: GenAccount[];
  open: boolean;
  onOpenChange: (o: boolean) => void;
  presetDateKey?: string | null;
}) {
  const router = useRouter();
  const [accountId, setAccountId] = useState(accounts[0]?.id ?? "");
  const [title, setTitle] = useState("");
  const [postType, setPostType] = useState<"single" | "thread">("single");
  const [mode, setMode] = useState<"write" | "ai">("write");
  const [topic, setTopic] = useState("");
  const [body, setBody] = useState("");
  const [schedule, setSchedule] = useState(Boolean(presetDateKey));
  const [date, setDate] = useState(presetDateKey ?? "");
  const [time, setTime] = useState("08:00");
  const [generating, startGen] = useTransition();
  const [saving, startSave] = useTransition();

  useEffect(() => {
    if (open) {
      setSchedule(Boolean(presetDateKey));
      if (presetDateKey) setDate(presetDateKey);
    }
  }, [open, presetDateKey]);

  const selected = accounts.find((a) => a.id === accountId);

  function generate() {
    if (!accountId) return toast.error("Pilih akun dulu.");
    if (!selected?.hasPersona) return toast.error("Akun ini belum punya persona. Pakai mode tulis sendiri atau buat persona dulu.");
    startGen(async () => {
      const res = await generateBodyForAccount(accountId, topic, postType);
      if (res.ok) {
        setBody((res.segments ?? []).join("\n\n"));
        if (!title && res.title) setTitle(res.title);
        toast.success("Draf dibuat AI. Silakan edit bila perlu.");
      } else {
        toast.error(res.error ?? "Gagal generate.");
      }
    });
  }

  function save() {
    if (!accountId) return toast.error("Pilih akun dulu.");
    if (!body.trim()) return toast.error("Isi konten masih kosong.");
    let scheduleAtUtc: string | null = null;
    if (schedule) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return toast.error("Pilih tanggal yang valid.");
      const [y, mo, d] = date.split("-").map(Number);
      const [h, mi] = time.split(":").map(Number);
      scheduleAtUtc = wibToUtcIso(y, mo, d, h || 0, mi || 0);
    }
    const segments = postType === "thread" ? body.split(/\n\s*\n/) : [body];
    startSave(async () => {
      const res = await createManualContent({
        accountId,
        title,
        segments,
        postType,
        scheduleAtUtc,
        aiAssisted: mode === "ai",
      });
      if (res.ok) {
        toast.success(schedule ? "Konten dibuat & dijadwalkan." : "Konten tersimpan sebagai draf.");
        onOpenChange(false);
        setTitle("");
        setTopic("");
        setBody("");
        router.refresh();
      } else {
        toast.error(res.error ?? "Gagal menyimpan.");
      }
    });
  }

  const busy = generating || saving;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92dvh] max-w-xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Buat konten</DialogTitle>
          <DialogDescription>
            Tulis sendiri atau minta bantuan AI. Bisa langsung dijadwalkan ke tanggal tertentu.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="mc-account">Akun</Label>
              <select
                id="mc-account"
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
                className="h-10 w-full rounded-lg border bg-background px-3 text-sm outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40"
              >
                {accounts.length === 0 ? <option value="">Belum ada akun</option> : null}
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    @{a.username ?? "akun"} {a.hasPersona ? "" : "(tanpa persona)"}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label>Tipe</Label>
              <div className="flex gap-2">
                {(["single", "thread"] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setPostType(t)}
                    className={`flex-1 rounded-lg border px-3 py-2 text-sm transition ${
                      postType === t ? "border-primary bg-primary/5 font-medium text-primary ring-1 ring-primary" : "hover:bg-accent"
                    }`}
                  >
                    {t === "single" ? "Single" : "Nested"}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Mode toggle */}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setMode("write")}
              className={`flex flex-1 items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm transition ${
                mode === "write" ? "border-primary bg-primary/5 font-medium text-primary ring-1 ring-primary" : "hover:bg-accent"
              }`}
            >
              <PenLine className="size-4" /> Tulis sendiri
            </button>
            <button
              type="button"
              onClick={() => setMode("ai")}
              className={`flex flex-1 items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm transition ${
                mode === "ai" ? "border-primary bg-primary/5 font-medium text-primary ring-1 ring-primary" : "hover:bg-accent"
              }`}
            >
              <Sparkles className="size-4" /> Bantu AI
            </button>
          </div>

          {mode === "ai" ? (
            <div className="space-y-1.5 rounded-lg border bg-muted/30 p-3">
              <Label htmlFor="mc-topic">Topik / ide singkat</Label>
              <div className="flex gap-2">
                <Input
                  id="mc-topic"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="Tips menjaga kesehatan mata bagi pekerja kantoran"
                />
                <Button type="button" variant="secondary" onClick={generate} disabled={busy}>
                  {generating ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
                  Generate
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">AI memakai persona utama akun ini.</p>
            </div>
          ) : null}

          <div className="space-y-1.5">
            <Label htmlFor="mc-title">Judul (opsional)</Label>
            <Input id="mc-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Judul singkat" />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="mc-body">
              Isi konten
              {postType === "thread" ? (
                <HelpTip>Pisahkan tiap post dalam thread dengan satu baris kosong.</HelpTip>
              ) : null}
            </Label>
            <Textarea
              id="mc-body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={postType === "thread" ? 7 : 5}
              placeholder={
                postType === "thread"
                  ? "Post 1...\n\nPost 2...\n\nPost 3..."
                  : "Tulis isi postingan di sini..."
              }
            />
          </div>

          <div className="space-y-2 rounded-lg border p-3">
            <label className="flex items-center gap-2 text-sm font-medium">
              <input
                type="checkbox"
                checked={schedule}
                onChange={(e) => setSchedule(e.target.checked)}
                className="size-4 rounded border-input accent-primary"
              />
              Jadwalkan sekarang
            </label>
            {schedule ? (
              <div className="flex flex-wrap items-end gap-2">
                <div className="space-y-1">
                  <Label htmlFor="mc-date" className="text-xs">
                    Tanggal
                  </Label>
                  <Input
                    id="mc-date"
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-auto"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="mc-time" className="text-xs">
                    Jam (WIB)
                  </Label>
                  <Input
                    id="mc-time"
                    type="time"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className="w-auto"
                  />
                </div>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">Kalau tidak dicentang, konten disimpan sebagai draf.</p>
            )}
          </div>
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="ghost" disabled={busy}>
              Batal
            </Button>
          </DialogClose>
          <Button onClick={save} disabled={busy}>
            {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
            {schedule ? "Simpan & jadwalkan" : "Simpan draf"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

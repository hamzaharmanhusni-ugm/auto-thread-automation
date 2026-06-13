"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Sparkles, Loader2, Check, X, FileText, Wand2 } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/empty-state";
import { generateIdeasAction, setIdeaStatus, createContentFromIdea } from "./actions";

export type AccountOption = { id: string; username: string | null; hasPersona: boolean };
export type IdeaItem = {
  id: string;
  title: string;
  angle: string | null;
  hook: string | null;
  status: string;
  username: string | null;
};

const STATUS: Record<string, { label: string; variant: "default" | "secondary" | "success" | "outline" }> = {
  draft: { label: "Ide Baru", variant: "secondary" },
  approved: { label: "Disetujui", variant: "default" },
  rejected: { label: "Ditolak", variant: "outline" },
  used: { label: "Jadi Konten", variant: "success" },
};

export function ResearchPanel({ accounts, ideas }: { accounts: AccountOption[]; ideas: IdeaItem[] }) {
  const router = useRouter();
  const [accountId, setAccountId] = useState(accounts[0]?.id ?? "");
  const [count, setCount] = useState(5);
  const [generating, setGenerating] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const active = ideas.filter((i) => i.status === "draft" || i.status === "approved");
  const archived = ideas.filter((i) => i.status === "used" || i.status === "rejected");

  async function onGenerate() {
    if (!accountId) return toast.error("Pilih akun dulu.");
    setGenerating(true);
    const res = await generateIdeasAction(accountId, count);
    setGenerating(false);
    if (res.ok) {
      toast.success(`${res.count} ide baru dibuat.`);
      router.refresh();
    } else {
      toast.error(res.error ?? "Gagal.");
    }
  }

  function withBusy(id: string, fn: () => Promise<{ ok: boolean; error?: string; contentId?: string }>, ok: string) {
    setBusyId(id);
    startTransition(async () => {
      const res = await fn();
      setBusyId(null);
      if (res.ok) {
        toast.success(ok);
        router.refresh();
      } else {
        toast.error(res.error ?? "Gagal.");
      }
    });
  }

  const hasUsable = accounts.some((a) => a.hasPersona);

  return (
    <div className="space-y-6">
      {!hasUsable ? (
        <Card className="border-warning/40 bg-warning/5">
          <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4 text-sm">
            <p className="text-muted-foreground">
              {accounts.length === 0
                ? "Belum ada akun. Sinkronkan akun Threads dulu agar bisa generate ide."
                : "Akunmu belum punya persona. Buat persona dulu supaya AI tahu gaya kontenmu."}
            </p>
            <Button asChild size="sm" variant="outline">
              <Link href={accounts.length === 0 ? "/akun" : "/persona"}>
                {accounts.length === 0 ? "Ke Akun" : "Buat Persona"}
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : null}

      {/* Generator */}
      <Card>
        <CardContent className="flex flex-col gap-3 p-5 sm:flex-row sm:items-end">
          <div className="flex-1">
            <label className="mb-1.5 block text-sm font-medium">Akun / Persona</label>
            <select
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
              className="h-10 w-full rounded-md border bg-background px-3 text-sm outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
            >
              {accounts.length === 0 ? <option value="">Belum ada akun</option> : null}
              {accounts.map((a) => (
                <option key={a.id} value={a.id} disabled={!a.hasPersona}>
                  @{a.username} {a.hasPersona ? "" : "(tanpa persona)"}
                </option>
              ))}
            </select>
          </div>
          <div className="w-full sm:w-28">
            <label className="mb-1.5 block text-sm font-medium">Jumlah ide</label>
            <input
              type="number"
              min={1}
              max={10}
              value={count}
              onChange={(e) => setCount(Number(e.target.value))}
              className="h-10 w-full rounded-md border bg-background px-3 text-sm tabular-nums outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
            />
          </div>
          <Button onClick={onGenerate} disabled={generating || accounts.length === 0} size="lg">
            {generating ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
            Generate Ide
          </Button>
        </CardContent>
      </Card>

      {/* Active ideas */}
      {active.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {active.map((i) => (
            <Card key={i.id}>
              <CardContent className="flex h-full flex-col gap-3 p-5">
                <div className="flex items-start justify-between gap-2">
                  <Badge variant={STATUS[i.status]?.variant}>{STATUS[i.status]?.label}</Badge>
                  {i.username ? <span className="text-xs text-muted-foreground">@{i.username}</span> : null}
                </div>
                <h3 className="font-display font-semibold leading-snug">{i.title}</h3>
                {i.hook ? <p className="text-sm text-muted-foreground">“{i.hook}”</p> : null}
                {i.angle ? <p className="text-xs text-muted-foreground">Angle: {i.angle}</p> : null}

                <div className="mt-auto flex flex-wrap gap-2 pt-2">
                  {i.status === "draft" ? (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={busyId === i.id}
                        onClick={() => withBusy(i.id, () => setIdeaStatus(i.id, "approved"), "Ide disetujui.")}
                      >
                        <Check className="size-3.5" /> Setujui
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={busyId === i.id}
                        onClick={() => withBusy(i.id, () => setIdeaStatus(i.id, "rejected"), "Ide ditolak.")}
                      >
                        <X className="size-3.5" /> Tolak
                      </Button>
                    </>
                  ) : null}
                  <Button
                    size="sm"
                    disabled={busyId === i.id}
                    onClick={() => withBusy(i.id, () => createContentFromIdea(i.id, "single"), "Konten dibuat. Cek menu Konten / Kalender.")}
                  >
                    {busyId === i.id ? <Loader2 className="size-3.5 animate-spin" /> : <Wand2 className="size-3.5" />}
                    Buat Single
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    disabled={busyId === i.id}
                    onClick={() => withBusy(i.id, () => createContentFromIdea(i.id, "thread"), "Nested (thread) dibuat. Cek menu Konten / Kalender.")}
                  >
                    Buat Nested
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={FileText}
          title="Belum ada ide"
          description="Pilih akun lalu klik Generate Ide. AI akan membaca persona dan menghindari duplikasi dari konten sebelumnya."
        />
      )}

      {/* Archived */}
      {archived.length > 0 ? (
        <div>
          <p className="eyebrow mb-3">Riwayat</p>
          <div className="flex flex-wrap gap-2">
            {archived.map((i) => (
              <span
                key={i.id}
                className="inline-flex items-center gap-2 rounded-full border bg-card px-3 py-1.5 text-xs"
              >
                <Badge variant={STATUS[i.status]?.variant}>{STATUS[i.status]?.label}</Badge>
                <span className="max-w-[220px] truncate text-muted-foreground">{i.title}</span>
              </span>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

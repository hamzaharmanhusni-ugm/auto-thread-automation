"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, GripVertical, X, FileText, Plus, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { wibParts, wibToUtcIso, wibTimeLabel, currentWibMonthKey } from "@/lib/date";
import { postTypeLabel } from "@/lib/status";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/status-badge";
import { EmptyState } from "@/components/empty-state";
import { scheduleContent, rescheduleSchedule, cancelSchedule } from "./actions";
import { ManualContentDialog, type GenAccount } from "./manual-content-dialog";

const pad = (n: number) => String(n).padStart(2, "0");
const WEEKDAYS = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];
const DEFAULT_HOUR = 8; // 08.00 WIB

export type DraftItem = { id: string; title: string | null; post_type: string; username: string | null };
export type ScheduleItem = {
  id: string;
  content_id: string;
  scheduled_at: string;
  status: string;
  title: string | null;
  post_type: string;
};

type DragData = { kind: "draft"; id: string } | { kind: "sched"; id: string; iso: string };

export function CalendarBoard({
  monthKey,
  drafts,
  schedules,
  accounts,
}: {
  monthKey: string;
  drafts: DraftItem[];
  schedules: ScheduleItem[];
  accounts: GenAccount[];
}) {
  const [pending, startTransition] = useTransition();
  const [drag, setDrag] = useState<DragData | null>(null);
  const [overKey, setOverKey] = useState<string | null>(null);
  const [manualOpen, setManualOpen] = useState(false);
  const [presetDate, setPresetDate] = useState<string | null>(null);

  function openManual(dateKey?: string) {
    setPresetDate(dateKey ?? null);
    setManualOpen(true);
  }

  const [year, month] = monthKey.split("-").map(Number); // month 1-12

  const { cells, prevKey, nextKey, label, todayKey } = useMemo(() => {
    const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
    const firstWeekday = (new Date(Date.UTC(year, month - 1, 1)).getUTCDay() + 6) % 7; // Mon=0
    const cells: (string | null)[] = [];
    for (let i = 0; i < firstWeekday; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(`${year}-${pad(month)}-${pad(d)}`);
    const prev = month === 1 ? `${year - 1}-12` : `${year}-${pad(month - 1)}`;
    const next = month === 12 ? `${year + 1}-01` : `${year}-${pad(month + 1)}`;
    const label = new Intl.DateTimeFormat("id-ID", { month: "long", year: "numeric" }).format(
      new Date(Date.UTC(year, month - 1, 1)),
    );
    return { cells, prevKey: prev, nextKey: next, label, todayKey: todayWibKey() };
  }, [year, month]);

  const byDay = useMemo(() => {
    const map = new Map<string, ScheduleItem[]>();
    for (const s of schedules) {
      const key = wibParts(s.scheduled_at).dateKey;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(s);
    }
    for (const list of map.values())
      list.sort((a, b) => a.scheduled_at.localeCompare(b.scheduled_at));
    return map;
  }, [schedules]);

  function run(action: () => Promise<{ ok: boolean; error?: string }>, success: string) {
    startTransition(async () => {
      const res = await action();
      if (res.ok) toast.success(success);
      else toast.error(res.error ?? "Terjadi kesalahan.");
    });
  }

  function onDrop(dateKey: string) {
    setOverKey(null);
    if (!drag) return;
    const [y, m, d] = dateKey.split("-").map(Number);
    if (drag.kind === "draft") {
      const iso = wibToUtcIso(y, m, d, DEFAULT_HOUR, 0);
      run(() => scheduleContent(drag.id, iso), `Dijadwalkan ${d} ${monthShort(m)} ${pad(DEFAULT_HOUR)}.00 WIB`);
    } else {
      const t = wibParts(drag.iso);
      const iso = wibToUtcIso(y, m, d, t.hour, t.minute);
      run(() => rescheduleSchedule(drag.id, iso), `Dipindahkan ke ${d} ${monthShort(m)}`);
    }
    setDrag(null);
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[280px_1fr]">
      {/* Draft panel */}
      <div>
        <div className="mb-2 flex items-center justify-between gap-2">
          <h2 className="text-sm font-semibold text-muted-foreground">Draf siap dijadwalkan</h2>
          <Button size="sm" variant="outline" onClick={() => openManual()}>
            <Plus className="size-4" /> Buat konten
          </Button>
        </div>
        <p className="mb-3 text-xs text-muted-foreground">
          Tarik kartu ke tanggal untuk menjadwalkan (default 08.00 WIB), atau klik <span className="font-medium">Buat konten</span> untuk menulis/generate baru.
        </p>
        <div className="space-y-2">
          {drafts.length === 0 ? (
            <Card>
              <CardContent className="space-y-2 p-4 text-sm text-muted-foreground">
                <p>Belum ada draf.</p>
                <Button size="sm" onClick={() => openManual()}>
                  <Sparkles className="size-4" /> Buat konten pertama
                </Button>
              </CardContent>
            </Card>
          ) : (
            drafts.map((d) => (
              <div
                key={d.id}
                draggable
                onDragStart={() => setDrag({ kind: "draft", id: d.id })}
                onDragEnd={() => setDrag(null)}
                className="group flex cursor-grab items-start gap-2 rounded-lg border bg-card p-3 shadow-sm active:cursor-grabbing"
              >
                <GripVertical className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{d.title ?? "Tanpa judul"}</p>
                  <p className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Badge variant="outline">{postTypeLabel[d.post_type]}</Badge>
                    {d.username ? `@${d.username}` : ""}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Calendar */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold capitalize">{label}</h2>
          <div className="flex items-center gap-1">
            <Button asChild variant="outline" size="icon" aria-label="Bulan sebelumnya">
              <Link href={`/kalender?month=${prevKey}`}>
                <ChevronLeft className="size-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link href={`/kalender?month=${currentWibMonthKey()}`}>Hari ini</Link>
            </Button>
            <Button asChild variant="outline" size="icon" aria-label="Bulan berikutnya">
              <Link href={`/kalender?month=${nextKey}`}>
                <ChevronRight className="size-4" />
              </Link>
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-px overflow-hidden rounded-xl border bg-border">
          {WEEKDAYS.map((w) => (
            <div key={w} className="bg-muted/50 py-2 text-center text-xs font-medium text-muted-foreground">
              {w}
            </div>
          ))}
          {cells.map((dateKey, i) => {
            if (!dateKey) return <div key={`b${i}`} className="min-h-28 bg-card/40" />;
            const day = Number(dateKey.split("-")[2]);
            const items = byDay.get(dateKey) ?? [];
            const isToday = dateKey === todayKey;
            const isOver = overKey === dateKey;
            return (
              <div
                key={dateKey}
                onDragOver={(e) => {
                  e.preventDefault();
                  setOverKey(dateKey);
                }}
                onDragLeave={() => setOverKey((k) => (k === dateKey ? null : k))}
                onDrop={() => onDrop(dateKey)}
                className={cn(
                  "group/cell relative min-h-28 bg-card p-1.5 transition-colors",
                  isOver && "bg-primary/10 ring-1 ring-inset ring-primary",
                  pending && "opacity-70",
                )}
              >
                <button
                  type="button"
                  aria-label={`Buat konten untuk tanggal ${day}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    openManual(dateKey);
                  }}
                  className="absolute right-1 top-1 flex size-5 items-center justify-center rounded-md bg-primary/10 text-primary opacity-0 transition hover:bg-primary/20 focus-visible:opacity-100 group-hover/cell:opacity-100"
                >
                  <Plus className="size-3.5" />
                </button>
                <div
                  className={cn(
                    "mb-1 inline-flex size-6 items-center justify-center rounded-full text-xs",
                    isToday ? "bg-primary font-semibold text-primary-foreground" : "text-muted-foreground",
                  )}
                >
                  {day}
                </div>
                <div className="space-y-1">
                  {items.map((s) => (
                    <div
                      key={s.id}
                      draggable={s.status === "pending" || s.status === "scheduled"}
                      onDragStart={() => setDrag({ kind: "sched", id: s.id, iso: s.scheduled_at })}
                      onDragEnd={() => setDrag(null)}
                      className="group rounded-md border bg-background px-1.5 py-1 text-xs shadow-sm"
                    >
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-medium tabular-nums">{wibTimeLabel(s.scheduled_at)}</span>
                        {(s.status === "pending" || s.status === "scheduled") && (
                          <button
                            type="button"
                            aria-label="Batalkan jadwal"
                            className="-m-1 flex size-6 items-center justify-center rounded transition hover:bg-destructive/10 sm:opacity-0 sm:group-hover:opacity-100"
                            onClick={() => run(() => cancelSchedule(s.id), "Jadwal dibatalkan.")}
                          >
                            <X className="size-3.5 text-muted-foreground hover:text-destructive" />
                          </button>
                        )}
                      </div>
                      <p className="truncate" title={s.title ?? ""}>
                        {s.title ?? "Tanpa judul"}
                      </p>
                      <div className="mt-0.5">
                        <StatusBadge kind="schedule" status={s.status} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {schedules.length === 0 && drafts.length === 0 ? (
          <div className="mt-5">
            <EmptyState
              icon={FileText}
              title="Belum ada yang dijadwalkan"
              description="Buat konten langsung di sini, lalu tarik ke tanggal yang kamu mau."
              action={
                <Button onClick={() => openManual()}>
                  <Plus className="size-4" /> Buat konten
                </Button>
              }
            />
          </div>
        ) : null}
      </div>

      <ManualContentDialog
        accounts={accounts}
        open={manualOpen}
        onOpenChange={setManualOpen}
        presetDateKey={presetDate}
      />
    </div>
  );
}

function todayWibKey(): string {
  const p = wibParts(new Date().toISOString());
  return p.dateKey;
}

function monthShort(m1: number): string {
  return new Intl.DateTimeFormat("id-ID", { month: "short" }).format(new Date(Date.UTC(2020, m1 - 1, 1)));
}

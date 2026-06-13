"use client";

import { useState, useTransition } from "react";
import { Eye, Heart, Repeat2, MessageCircle, Loader2, BarChart3, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDateTimeWIB } from "@/lib/utils";
import { fetchContentStats, type ContentStats } from "@/app/(app)/konten/content-actions";

export type PostedItem = {
  id: string;
  title: string | null;
  created_at: string;
  username: string | null;
  viral_score: number | null;
  commentCount: number;
};

function StatCell({
  icon: Icon,
  value,
  label,
}: {
  icon: React.ComponentType<{ className?: string }>;
  value: number | null;
  label: string;
}) {
  return (
    <div className="flex items-center gap-1.5 text-sm">
      <Icon className="size-4 text-muted-foreground" />
      <span className="tabular-nums font-medium">{value ?? "—"}</span>
      <span className="text-xs text-muted-foreground">{label}</span>
    </div>
  );
}

function Row({ item }: { item: PostedItem }) {
  const [stats, setStats] = useState<ContentStats | null>(null);
  const [loading, start] = useTransition();

  function load() {
    start(async () => {
      const res = await fetchContentStats(item.id);
      if (res.ok && res.stats) setStats(res.stats);
      else toast.error(res.error ?? "Gagal mengambil statistik.");
    });
  }

  return (
    <li className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium">{item.title ?? "Tanpa judul"}</p>
        <p className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          {item.username ? <span>@{item.username}</span> : null}
          <span>{formatDateTimeWIB(item.created_at)}</span>
          {item.viral_score ? <Badge variant="warning">Viral {item.viral_score}/10</Badge> : null}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <StatCell icon={MessageCircle} value={item.commentCount} label="komen" />
        {stats ? (
          <>
            <StatCell icon={Eye} value={stats.views} label="views" />
            <StatCell icon={Heart} value={stats.likes} label="suka" />
            <StatCell icon={Repeat2} value={stats.shares} label="bagikan" />
          </>
        ) : (
          <Button size="sm" variant="outline" onClick={load} disabled={loading}>
            {loading ? <Loader2 className="size-3.5 animate-spin" /> : <BarChart3 className="size-3.5" />}
            Muat statistik
          </Button>
        )}
        {stats ? (
          <Button size="icon" variant="ghost" className="size-8" onClick={load} disabled={loading} aria-label="Muat ulang">
            {loading ? <Loader2 className="size-3.5 animate-spin" /> : <RefreshCw className="size-3.5" />}
          </Button>
        ) : null}
      </div>
    </li>
  );
}

export function AnalyticsList({ items }: { items: PostedItem[] }) {
  return (
    <Card>
      <CardContent className="p-0">
        <ul className="divide-y">
          {items.map((i) => (
            <Row key={i.id} item={i} />
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

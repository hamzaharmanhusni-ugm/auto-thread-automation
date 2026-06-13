"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import {
  MoreVertical,
  Eye,
  CalendarPlus,
  BarChart3,
  Trash2,
  MessageCircle,
  MessagesSquare,
  Loader2,
  Heart,
  Repeat2,
} from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/status-badge";
import { ConfirmDialog } from "@/components/confirm-dialog";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { postTypeLabel } from "@/lib/status";
import { formatDateTimeWIB } from "@/lib/utils";
import { deleteContent, fetchContentStats, type ContentStats } from "./content-actions";
import { SeedCommentsDialog } from "./seed-comments-dialog";

export type ContentItem = {
  id: string;
  title: string | null;
  body: string;
  post_type: string;
  status: string;
  viral_score: number | null;
  created_at: string;
  username: string | null;
  commentCount: number;
};

function Stat({ icon: Icon, value }: { icon: React.ComponentType<{ className?: string }>; value: number | null }) {
  return (
    <span className="inline-flex items-center gap-1 tabular-nums">
      <Icon className="size-3.5" /> {value ?? "—"}
    </span>
  );
}

function ContentRow({ c, defaultSeedCount }: { c: ContentItem; defaultSeedCount: number }) {
  const [expanded, setExpanded] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [seedOpen, setSeedOpen] = useState(false);
  const [stats, setStats] = useState<ContentStats | null>(null);
  const [loadingStats, start] = useTransition();
  const isDraft = c.status === "draft";
  const isPosted = c.status === "posted";

  function loadStats() {
    start(async () => {
      const res = await fetchContentStats(c.id);
      if (res.ok && res.stats) setStats(res.stats);
      else toast.error(res.error ?? "Gagal mengambil statistik.");
    });
  }

  return (
    <li className="flex items-start gap-4 px-5 py-4">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="truncate font-medium">{c.title ?? "Tanpa judul"}</p>
          <Badge variant="outline">{postTypeLabel[c.post_type]}</Badge>
          {c.viral_score ? <Badge variant="warning">Viral {c.viral_score}/10</Badge> : null}
        </div>
        <p className={`mt-1 text-sm text-muted-foreground ${expanded ? "whitespace-pre-wrap" : "line-clamp-2"}`}>
          {c.body}
        </p>
        <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
          <span>
            {c.username ? `@${c.username} · ` : ""}
            {formatDateTimeWIB(c.created_at)}
          </span>
          <Stat icon={MessageCircle} value={c.commentCount} />
          {stats ? (
            <>
              <Stat icon={Eye} value={stats.views} />
              <Stat icon={Heart} value={stats.likes} />
              <Stat icon={Repeat2} value={stats.shares} />
            </>
          ) : null}
          {loadingStats ? <Loader2 className="size-3.5 animate-spin" /> : null}
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <StatusBadge kind="content" status={c.status} />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="icon" variant="ghost" className="size-8" aria-label="Aksi konten">
              <MoreVertical className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onSelect={() => setExpanded((e) => !e)}>
              <Eye /> {expanded ? "Sembunyikan isi" : "Lihat isi lengkap"}
            </DropdownMenuItem>
            {isDraft ? (
              <DropdownMenuItem asChild>
                <Link href="/kalender">
                  <CalendarPlus /> Jadwalkan
                </Link>
              </DropdownMenuItem>
            ) : null}
            {isPosted ? (
              <DropdownMenuItem onSelect={loadStats}>
                <BarChart3 /> Lihat statistik
              </DropdownMenuItem>
            ) : null}
            {isPosted ? (
              <DropdownMenuItem
                onSelect={(e) => {
                  e.preventDefault();
                  setSeedOpen(true);
                }}
              >
                <MessagesSquare /> Komentar antar akun
              </DropdownMenuItem>
            ) : null}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              variant="destructive"
              onSelect={(e) => {
                e.preventDefault();
                setConfirmOpen(true);
              }}
            >
              <Trash2 /> Hapus
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Hapus konten ini?"
        description={
          <>
            <span className="font-medium">{c.title ?? "Konten"}</span> akan dihapus permanen. Jika sedang terjadwal,
            jadwalnya ikut dibatalkan. Tindakan ini tidak bisa dibatalkan.
          </>
        }
        confirmLabel="Hapus konten"
        successMessage="Konten dihapus."
        action={() => deleteContent(c.id)}
      />

      {isPosted ? (
        <SeedCommentsDialog
          contentId={c.id}
          defaultCount={defaultSeedCount}
          open={seedOpen}
          onOpenChange={setSeedOpen}
        />
      ) : null}
    </li>
  );
}

export function KontenList({ items, defaultSeedCount }: { items: ContentItem[]; defaultSeedCount: number }) {
  return (
    <Card>
      <CardContent className="p-0">
        <ul className="divide-y">
          {items.map((c) => (
            <ContentRow key={c.id} c={c} defaultSeedCount={defaultSeedCount} />
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

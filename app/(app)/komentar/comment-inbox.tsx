"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { MessageCircle, Sparkles, Send, SkipForward, Loader2, Info } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { EmptyState } from "@/components/empty-state";
import { AutoReplyModeSelect } from "@/components/auto-reply-mode-select";
import { StatusBadge } from "@/components/status-badge";
import { formatDateTimeWIB } from "@/lib/utils";
import { generateReply, sendReply, skipReply } from "./actions";

export type AccountRow = { id: string; username: string | null; auto_reply_mode: string };
export type CommentRow = {
  id: string;
  commenter_username: string | null;
  comment_text: string | null;
  ai_reply: string | null;
  reply_status: string;
  received_at: string;
  account_username: string | null;
  content_title: string | null;
};

const FILTERS = [
  { key: "pending", label: "Perlu Dibalas" },
  { key: "replied", label: "Sudah Dibalas" },
  { key: "all", label: "Semua" },
];

export function CommentInbox({ accounts, comments }: { accounts: AccountRow[]; comments: CommentRow[] }) {
  const [filter, setFilter] = useState("pending");

  const filtered = useMemo(() => {
    if (filter === "all") return comments;
    if (filter === "replied") return comments.filter((c) => c.reply_status === "replied");
    return comments.filter((c) => c.reply_status === "pending" || c.reply_status === "approved");
  }, [comments, filter]);

  return (
    <div className="space-y-6">
      {/* Per-account auto-reply mode */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Mode Balas Otomatis per Akun</CardTitle>
          <CardDescription>
            <span className="font-medium">Manual</span>: kamu balas sendiri ·{" "}
            <span className="font-medium">Semi</span>: AI buat draf, kamu setujui ·{" "}
            <span className="font-medium">Otomatis Penuh</span>: AI balas & kirim sendiri.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {accounts.length === 0 ? (
            <p className="text-sm text-muted-foreground">Belum ada akun. Sinkronkan dulu di menu Akun.</p>
          ) : (
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {accounts.map((a) => (
                <div key={a.id} className="flex items-center justify-between gap-2 rounded-lg border p-2.5">
                  <span className="truncate text-sm font-medium">@{a.username}</span>
                  <AutoReplyModeSelect accountId={a.id} value={a.auto_reply_mode} />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Filter */}
      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            type="button"
            onClick={() => setFilter(f.key)}
            className={`rounded-full border px-3 py-1.5 text-sm transition ${
              filter === f.key ? "border-primary bg-primary/10 font-medium text-primary" : "hover:bg-accent"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* List */}
      {filtered.length > 0 ? (
        <div className="space-y-3">
          {filtered.map((c) => (
            <CommentCard key={c.id} comment={c} />
          ))}
        </div>
      ) : comments.length === 0 ? (
        <EmptyState
          icon={MessageCircle}
          title="Belum ada komentar masuk"
          description="Komentar dari Threads akan muncul di sini lewat webhook Repliz. Atur mode balas di atas, lalu komentar baru bisa dibalas manual atau otomatis oleh AI."
        />
      ) : (
        <p className="py-8 text-center text-sm text-muted-foreground">Tidak ada komentar pada filter ini.</p>
      )}

      <p className="flex items-center gap-2 text-xs text-muted-foreground">
        <Info className="size-3.5" /> Mode <span className="font-medium">Otomatis Penuh</span> membalas komentar
        baru tanpa persetujuan — gunakan dengan hati-hati.
      </p>
    </div>
  );
}

function CommentCard({ comment }: { comment: CommentRow }) {
  const router = useRouter();
  const [reply, setReply] = useState(comment.ai_reply ?? "");
  const [busy, setBusy] = useState<"gen" | "send" | "skip" | null>(null);
  const [, start] = useTransition();
  const done = comment.reply_status === "replied" || comment.reply_status === "skipped";

  function run(kind: "gen" | "send" | "skip", fn: () => Promise<{ ok: boolean; error?: string; reply?: string }>, okMsg: string) {
    setBusy(kind);
    start(async () => {
      const res = await fn();
      setBusy(null);
      if (res.ok) {
        if (res.reply) setReply(res.reply);
        toast.success(okMsg);
        router.refresh();
      } else {
        toast.error(res.error ?? "Gagal.");
      }
    });
  }

  return (
    <Card>
      <CardContent className="space-y-3 p-4">
        <div className="flex items-start gap-3">
          <Avatar className="size-8">
            <AvatarFallback>{(comment.commenter_username ?? "?").slice(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-medium">{comment.commenter_username ?? "Anonim"}</span>
              <StatusBadge kind="reply" status={comment.reply_status} />
              <span className="text-xs text-muted-foreground">{formatDateTimeWIB(comment.received_at)}</span>
            </div>
            <p className="mt-1 text-sm">{comment.comment_text}</p>
            {comment.content_title ? (
              <p className="mt-1 truncate text-xs text-muted-foreground">di: {comment.content_title}</p>
            ) : null}
          </div>
        </div>

        {!done ? (
          <>
            <textarea
              value={reply}
              onChange={(e) => setReply(e.target.value)}
              placeholder="Tulis balasan, atau klik “Buat balasan AI”…"
              rows={2}
              className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
            />
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                variant="outline"
                disabled={busy !== null}
                onClick={() => run("gen", () => generateReply(comment.id), "Balasan AI dibuat.")}
              >
                {busy === "gen" ? <Loader2 className="size-3.5 animate-spin" /> : <Sparkles className="size-3.5" />}
                Buat balasan AI
              </Button>
              <Button
                size="sm"
                disabled={busy !== null || !reply.trim()}
                onClick={() => run("send", () => sendReply(comment.id, reply), "Balasan terkirim.")}
              >
                {busy === "send" ? <Loader2 className="size-3.5 animate-spin" /> : <Send className="size-3.5" />}
                Kirim
              </Button>
              <Button
                size="sm"
                variant="ghost"
                disabled={busy !== null}
                onClick={() => run("skip", () => skipReply(comment.id), "Komentar dilewati.")}
              >
                <SkipForward className="size-3.5" /> Lewati
              </Button>
            </div>
          </>
        ) : comment.ai_reply ? (
          <div className="rounded-md bg-muted/40 px-3 py-2 text-sm">
            <span className="text-xs font-medium text-muted-foreground">Balasan: </span>
            {comment.ai_reply}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

import Link from "next/link";
import {
  AtSign,
  FileText,
  CalendarClock,
  CheckCircle2,
  Lightbulb,
  MessageCircle,
  Reply,
  AlertTriangle,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getCurrentWorkspaceId } from "@/lib/workspace";
import { PageHeader, SectionLabel } from "@/components/page-header";
import { MetricCard } from "@/components/metric-card";
import { StatusBadge } from "@/components/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatDateTimeWIB } from "@/lib/utils";
import { postTypeLabel } from "@/lib/status";

type Metrics = {
  accounts_total: number;
  accounts_active: number;
  content_draft: number;
  content_scheduled: number;
  content_posted: number;
  content_failed: number;
  ideas_generated: number;
  comments_received: number;
  comments_replied: number;
  reply_rate: number;
  api_errors: number;
  webhook_errors: number;
  failed_jobs: number;
};

export default async function DashboardPage() {
  const ws = await getCurrentWorkspaceId();
  const supabase = await createClient();

  const [{ data: metricsRaw }, { data: recent }] = await Promise.all([
    supabase.rpc("dashboard_metrics", { p_workspace_id: ws }),
    supabase
      .from("contents")
      .select("id, title, post_type, status, viral_score, created_at")
      .order("created_at", { ascending: false })
      .limit(6),
  ]);

  const m = (metricsRaw ?? {}) as Partial<Metrics>;

  return (
    <>
      <PageHeader
        eyebrow="Ringkasan"
        title="Dashboard"
        description="Pantau performa otomatisasi Threads-mu dalam satu layar."
      />

      <SectionLabel>Akun &amp; Konten</SectionLabel>
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Total Akun" value={m.accounts_total ?? 0} icon={AtSign} hint={`${m.accounts_active ?? 0} aktif`} />
        <MetricCard label="Konten Tayang" value={m.content_posted ?? 0} icon={CheckCircle2} tone="success" />
        <MetricCard label="Terjadwal" value={m.content_scheduled ?? 0} icon={CalendarClock} />
        <MetricCard label="Draf" value={m.content_draft ?? 0} icon={FileText} />
      </section>

      <SectionLabel>AI &amp; Engagement</SectionLabel>
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Ide Dihasilkan AI" value={m.ideas_generated ?? 0} icon={Lightbulb} />
        <MetricCard label="Komentar Masuk" value={m.comments_received ?? 0} icon={MessageCircle} />
        <MetricCard label="Sudah Dibalas AI" value={m.comments_replied ?? 0} icon={Reply} tone="success" />
        <MetricCard label="Tingkat Balasan" value={m.reply_rate ?? 0} suffix="%" icon={Reply} />
      </section>

      {(m.api_errors || m.webhook_errors || m.failed_jobs) ? (
        <>
        <SectionLabel>Kesehatan Sistem</SectionLabel>
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <MetricCard label="Error API" value={m.api_errors ?? 0} icon={AlertTriangle} tone="danger" />
          <MetricCard label="Error Webhook" value={m.webhook_errors ?? 0} icon={AlertTriangle} tone="danger" />
          <MetricCard label="Job Gagal" value={m.failed_jobs ?? 0} icon={AlertTriangle} tone="warning" />
        </section>
        </>
      ) : null}

      {/* Konten terbaru */}
      <Card className="mt-6">
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle className="text-base">Konten Terbaru</CardTitle>
          <Button asChild variant="ghost" size="sm">
            <Link href="/konten">Lihat semua</Link>
          </Button>
        </CardHeader>
        <CardContent>
          {recent && recent.length > 0 ? (
            <ul className="divide-y">
              {recent.map((c) => (
                <li key={c.id} className="flex items-center gap-3 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{c.title ?? "Tanpa judul"}</p>
                    <p className="text-xs text-muted-foreground">
                      {postTypeLabel[c.post_type]} · {formatDateTimeWIB(c.created_at)}
                      {c.viral_score ? ` · Skor viral ${c.viral_score}/10` : ""}
                    </p>
                  </div>
                  <StatusBadge kind="content" status={c.status} />
                </li>
              ))}
            </ul>
          ) : (
            <p className="py-6 text-center text-sm text-muted-foreground">Belum ada konten.</p>
          )}
        </CardContent>
      </Card>
    </>
  );
}

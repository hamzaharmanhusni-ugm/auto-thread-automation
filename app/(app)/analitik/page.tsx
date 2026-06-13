import { CheckCircle2, MessageCircle, Reply, Lightbulb, BarChart3 } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getCurrentWorkspaceId } from "@/lib/workspace";
import { PageHeader, SectionLabel } from "@/components/page-header";
import { MetricCard } from "@/components/metric-card";
import { EmptyState } from "@/components/empty-state";
import { HelpTip } from "@/components/help-tip";
import { AnalyticsList, type PostedItem } from "./analytics-list";

type Metrics = {
  content_posted: number;
  ideas_generated: number;
  comments_received: number;
  comments_replied: number;
  reply_rate: number;
};

export default async function AnalitikPage() {
  const ws = await getCurrentWorkspaceId();
  const supabase = await createClient();

  const [{ data: metricsRaw }, { data: posted }, { data: commentRows }] = await Promise.all([
    supabase.rpc("dashboard_metrics", { p_workspace_id: ws }),
    supabase
      .from("contents")
      .select("id, title, viral_score, created_at, accounts(username)")
      .eq("status", "posted")
      .order("created_at", { ascending: false })
      .limit(100),
    supabase.from("comments").select("content_id").not("content_id", "is", null),
  ]);

  const m = (metricsRaw ?? {}) as Partial<Metrics>;

  const commentCounts = new Map<string, number>();
  for (const r of commentRows ?? []) {
    if (r.content_id) commentCounts.set(r.content_id, (commentCounts.get(r.content_id) ?? 0) + 1);
  }

  const items: PostedItem[] = (posted ?? []).map((c) => {
    const acc = c.accounts as unknown as { username: string | null } | null;
    return {
      id: c.id,
      title: c.title,
      created_at: c.created_at,
      username: acc?.username ?? null,
      viral_score: c.viral_score,
      commentCount: commentCounts.get(c.id) ?? 0,
    };
  });

  return (
    <>
      <PageHeader
        eyebrow="Performa"
        title="Analitik"
        description="Ringkasan engagement dan performa tiap konten yang sudah tayang."
      />

      <SectionLabel>Ringkasan</SectionLabel>
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Konten Tayang" value={m.content_posted ?? 0} icon={CheckCircle2} tone="success" />
        <MetricCard label="Komentar Masuk" value={m.comments_received ?? 0} icon={MessageCircle} />
        <MetricCard label="Sudah Dibalas" value={m.comments_replied ?? 0} icon={Reply} tone="success" />
        <MetricCard label="Tingkat Balasan" value={m.reply_rate ?? 0} suffix="%" icon={Reply} />
      </section>

      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Ide Dihasilkan AI" value={m.ideas_generated ?? 0} icon={Lightbulb} />
      </div>

      <div className="mt-8 mb-3 flex items-center gap-1.5">
        <p className="eyebrow">Performa per konten</p>
        <HelpTip>
          Views, suka, dan bagikan diambil langsung dari Repliz saat kamu klik &ldquo;Muat statistik&rdquo;. Jumlah
          komentar berasal dari komentar yang masuk ke aplikasi.
        </HelpTip>
      </div>

      {items.length > 0 ? (
        <AnalyticsList items={items} />
      ) : (
        <EmptyState
          icon={BarChart3}
          title="Belum ada konten tayang"
          description="Setelah konten dijadwalkan dan tayang lewat Repliz, performanya akan muncul di sini."
        />
      )}
    </>
  );
}

import Link from "next/link";
import { FileText, Sparkles } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getCurrentWorkspaceId } from "@/lib/workspace";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { KontenList, type ContentItem } from "./konten-list";

export default async function KontenPage() {
  await getCurrentWorkspaceId();
  const supabase = await createClient();
  const [{ data: contents }, { data: commentRows }, { data: settings }] = await Promise.all([
    supabase
      .from("contents")
      .select("id, title, body, post_type, status, viral_score, created_at, accounts(username)")
      .order("created_at", { ascending: false })
      .limit(100),
    supabase.from("comments").select("content_id").not("content_id", "is", null),
    supabase.from("workspace_settings").select("auto_comment_count").maybeSingle(),
  ]);

  const defaultSeedCount = Math.max(1, settings?.auto_comment_count ?? 2);

  const commentCounts = new Map<string, number>();
  for (const r of commentRows ?? []) {
    if (r.content_id) commentCounts.set(r.content_id, (commentCounts.get(r.content_id) ?? 0) + 1);
  }

  const items: ContentItem[] = (contents ?? []).map((c) => {
    const acc = c.accounts as unknown as { username: string | null } | null;
    return {
      id: c.id,
      title: c.title,
      body: c.body,
      post_type: c.post_type,
      status: c.status,
      viral_score: c.viral_score,
      created_at: c.created_at,
      username: acc?.username ?? null,
      commentCount: commentCounts.get(c.id) ?? 0,
    };
  });

  return (
    <>
      <PageHeader
        eyebrow="Pustaka"
        title="Konten"
        description="Semua konten yang dibuat: draf, terjadwal, dan sudah tayang."
        action={
          <Button asChild>
            <Link href="/riset">
              <Sparkles className="size-4" /> Buat Konten
            </Link>
          </Button>
        }
      />

      {items.length > 0 ? (
        <KontenList items={items} defaultSeedCount={defaultSeedCount} />
      ) : (
        <EmptyState
          icon={FileText}
          title="Belum ada konten"
          description="Mulai dari Riset Ide untuk menghasilkan ide konten dengan AI, lalu ubah jadi konten siap tayang."
          action={
            <Button asChild>
              <Link href="/riset">
                <Sparkles className="size-4" /> Buat Konten Pertama
              </Link>
            </Button>
          }
        />
      )}
    </>
  );
}

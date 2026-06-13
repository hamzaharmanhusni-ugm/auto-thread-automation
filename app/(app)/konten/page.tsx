import Link from "next/link";
import { FileText, Sparkles } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getCurrentWorkspaceId } from "@/lib/workspace";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { StatusBadge } from "@/components/status-badge";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { postTypeLabel } from "@/lib/status";
import { formatDateTimeWIB } from "@/lib/utils";

export default async function KontenPage() {
  await getCurrentWorkspaceId();
  const supabase = await createClient();
  const { data: contents } = await supabase
    .from("contents")
    .select("id, title, body, post_type, status, viral_score, created_at, accounts(username)")
    .order("created_at", { ascending: false })
    .limit(100);

  return (
    <>
      <PageHeader
        title="Konten"
        description="Semua konten yang dibuat — draf, terjadwal, dan sudah tayang."
        action={
          <Button asChild>
            <Link href="/riset">
              <Sparkles className="size-4" /> Buat Konten
            </Link>
          </Button>
        }
      />

      {contents && contents.length > 0 ? (
        <Card>
          <CardContent className="p-0">
            <ul className="divide-y">
              {contents.map((c) => {
                const acc = c.accounts as unknown as { username: string } | null;
                return (
                  <li key={c.id} className="flex items-start gap-4 px-5 py-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate font-medium">{c.title ?? "Tanpa judul"}</p>
                        <Badge variant="outline">{postTypeLabel[c.post_type]}</Badge>
                        {c.viral_score ? (
                          <Badge variant="warning">Viral {c.viral_score}/10</Badge>
                        ) : null}
                      </div>
                      <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{c.body}</p>
                      <p className="mt-1.5 text-xs text-muted-foreground">
                        {acc?.username ? `@${acc.username} · ` : ""}
                        {formatDateTimeWIB(c.created_at)}
                      </p>
                    </div>
                    <StatusBadge kind="content" status={c.status} />
                  </li>
                );
              })}
            </ul>
          </CardContent>
        </Card>
      ) : (
        <EmptyState
          icon={FileText}
          title="Belum ada konten"
          description="Mulai dari Riset Ide untuk menghasilkan ide konten dengan AI, lalu ubah jadi konten siap tayang."
          action={<Button>Buat Konten Pertama</Button>}
        />
      )}
    </>
  );
}

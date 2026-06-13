import Link from "next/link";
import { AtSign } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getCurrentWorkspaceId } from "@/lib/workspace";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SyncAccountButton } from "@/components/sync-account-button";
import { AutoReplyModeSelect } from "@/components/auto-reply-mode-select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatDateTimeWIB } from "@/lib/utils";

export default async function AkunPage() {
  await getCurrentWorkspaceId();
  const supabase = await createClient();
  const [{ data: accounts }, { data: replizCred }] = await Promise.all([
    supabase
      .from("accounts")
      .select("id, username, display_name, avatar_url, status, auto_reply_mode, last_synced_at, personas(count)")
      .order("created_at", { ascending: true }),
    supabase.from("repliz_credentials").select("workspace_id").eq("is_default", true).maybeSingle(),
  ]);

  const hasRepliz =
    Boolean(replizCred) || Boolean(process.env.REPLIZ_USERNAME && process.env.REPLIZ_PASSWORD);

  return (
    <>
      <PageHeader
        eyebrow="Threads"
        title="Akun"
        description="Akun Threads yang terhubung lewat Repliz."
        action={<SyncAccountButton />}
      />

      {accounts && accounts.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {accounts.map((a) => {
            const personaCount = (a.personas as unknown as { count: number }[])?.[0]?.count ?? 0;
            return (
              <Card key={a.id}>
                <CardContent className="p-5">
                  <div className="flex items-center gap-3">
                    <Avatar className="size-11">
                      {a.avatar_url ? <AvatarImage src={a.avatar_url} alt={a.username ?? ""} /> : null}
                      <AvatarFallback>
                        {(a.username ?? "TG").slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="truncate font-medium">@{a.username}</p>
                      <p className="truncate text-sm text-muted-foreground">{a.display_name}</p>
                    </div>
                  </div>
                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    <Badge variant={a.status === "active" ? "success" : "secondary"}>
                      {a.status === "active" ? "Aktif" : a.status}
                    </Badge>
                    <Badge variant="outline">{personaCount} persona</Badge>
                  </div>
                  <div className="mt-3 flex items-center justify-between gap-2">
                    <span className="text-xs text-muted-foreground">Balas otomatis</span>
                    <AutoReplyModeSelect accountId={a.id} value={a.auto_reply_mode} />
                  </div>
                  <p className="mt-3 text-xs text-muted-foreground">
                    Sinkron terakhir: {formatDateTimeWIB(a.last_synced_at)}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <EmptyState
          icon={AtSign}
          title={hasRepliz ? "Belum ada akun" : "Hubungkan Repliz dulu"}
          description={
            hasRepliz
              ? "Klik Sinkronkan Akun untuk menarik akun Threads-mu dari Repliz ke sini."
              : "Akun ditarik dari Repliz. Isi kredensial Repliz di Pengaturan dulu, lalu sinkronkan akunmu."
          }
          action={
            hasRepliz ? (
              <SyncAccountButton />
            ) : (
              <Button asChild>
                <Link href="/pengaturan">Ke Pengaturan</Link>
              </Button>
            )
          }
        />
      )}
    </>
  );
}

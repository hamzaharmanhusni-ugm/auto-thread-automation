import { UsersRound } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getCurrentWorkspaceId } from "@/lib/workspace";
import { PageHeader, SectionLabel } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ROLE_LABEL } from "@/lib/status";
import { InviteManager, type InviteRow } from "./invite-manager";
import { CredentialsCards } from "./credentials-cards";

export default async function PengaturanPage() {
  await getCurrentWorkspaceId();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: myMember } = await supabase
    .from("workspace_members")
    .select("role")
    .eq("user_id", user!.id)
    .maybeSingle();
  const isAdmin = myMember?.role === "admin";

  const [{ data: members }, { data: invites }, { data: replizCred }, { data: settings }] = await Promise.all([
    isAdmin ? supabase.rpc("list_members") : Promise.resolve({ data: [] as never[] }),
    isAdmin
      ? supabase
          .from("invites")
          .select("id, role, token, email, expires_at, accepted_at")
          .order("created_at", { ascending: false })
      : Promise.resolve({ data: [] as never[] }),
    isAdmin
      ? supabase.from("repliz_credentials").select("username_enc").eq("is_default", true).maybeSingle()
      : Promise.resolve({ data: null }),
    isAdmin
      ? supabase
          .from("workspace_settings")
          .select(
            "default_ai_provider, gemini_api_key, gemini_model, posts_per_day, auto_comment_count, daily_post_hour, mcp_auth_token",
          )
          .maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  const envMcpToken = process.env.MCP_AUTH_TOKEN ?? "";
  const mcpFromEnv = Boolean(envMcpToken);
  const mcpToken = envMcpToken || settings?.mcp_auth_token || "";
  const mcpConfigured = Boolean(mcpToken);
  const appUrl = process.env.APP_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? "";

  return (
    <>
      <PageHeader
        eyebrow="Workspace"
        title="Pengaturan"
        description="Kelola kredensial Repliz, kunci AI, integrasi MCP, anggota tim, dan undangan."
      />

      {/* Akunmu */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Akunmu</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center gap-3">
          <Avatar className="size-10">
            <AvatarFallback>{(user?.email ?? "TG").slice(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{user?.email}</p>
            <Badge variant="secondary">{ROLE_LABEL[myMember?.role ?? ""] ?? "Anggota"}</Badge>
          </div>
        </CardContent>
      </Card>

      {isAdmin ? (
        <>
          <SectionLabel>Kredensial &amp; Integrasi</SectionLabel>
          <CredentialsCards
            hasReplizCreds={Boolean(replizCred?.username_enc)}
            replizUsername={replizCred?.username_enc ?? null}
            aiProvider={settings?.default_ai_provider ?? "gemini"}
            hasGeminiKey={Boolean(settings?.gemini_api_key)}
            geminiModel={settings?.gemini_model ?? null}
            mcpConfigured={mcpConfigured}
            mcpToken={mcpToken}
            mcpFromEnv={mcpFromEnv}
            appUrl={appUrl}
            postsPerDay={settings?.posts_per_day ?? 3}
            autoCommentCount={settings?.auto_comment_count ?? 0}
            dailyPostHour={settings?.daily_post_hour ?? 8}
          />

          <SectionLabel>Tim</SectionLabel>
          <div className="grid gap-4 lg:grid-cols-2">
            <InviteManager invites={(invites ?? []) as InviteRow[]} />

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Anggota</CardTitle>
                <CardDescription>{members?.length ?? 0} orang di workspace ini.</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <ul className="divide-y">
                  {(members ?? []).map((m) => (
                    <li key={m.user_id} className="flex items-center gap-3 px-6 py-3">
                      <Avatar className="size-8">
                        <AvatarFallback>{(m.email ?? "?").slice(0, 2).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{m.full_name ?? m.email}</p>
                        <p className="truncate text-xs text-muted-foreground">{m.email}</p>
                      </div>
                      <Badge variant={m.role === "admin" ? "default" : "secondary"}>
                        {ROLE_LABEL[m.role] ?? m.role}
                      </Badge>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        </>
      ) : (
        <Card className="mt-4">
          <CardContent className="flex items-center gap-3 p-6 text-sm text-muted-foreground">
            <UsersRound className="size-5 shrink-0" />
            Hanya admin yang dapat mengundang anggota. Hubungi admin tim-mu.
          </CardContent>
        </Card>
      )}
    </>
  );
}

import { createClient } from "@/lib/supabase/server";
import { getCurrentWorkspaceId } from "@/lib/workspace";
import { PageHeader } from "@/components/page-header";
import { ResearchPanel, type AccountOption, type IdeaItem } from "./research-panel";

export default async function RisetPage() {
  await getCurrentWorkspaceId();
  const sb = await createClient();

  const [{ data: accounts }, { data: ideas }] = await Promise.all([
    sb.from("accounts").select("id, username, personas(id)").order("created_at", { ascending: true }),
    sb
      .from("content_ideas")
      .select("id, title, angle, hook, status, created_at, accounts(username)")
      .order("created_at", { ascending: false })
      .limit(60),
  ]);

  const accountOptions: AccountOption[] = (accounts ?? []).map((a) => ({
    id: a.id,
    username: a.username,
    hasPersona: ((a.personas as unknown as unknown[])?.length ?? 0) > 0,
  }));

  const ideaItems: IdeaItem[] = (ideas ?? []).map((i) => {
    const acc = i.accounts as unknown as { username: string | null } | null;
    return {
      id: i.id,
      title: i.title,
      angle: i.angle,
      hook: i.hook,
      status: i.status,
      username: acc?.username ?? null,
    };
  });

  return (
    <>
      <PageHeader
        eyebrow="AI"
        title="Riset Ide"
        description="Hasilkan ide konten baru dengan AI berdasarkan persona, lalu ubah jadi draf siap dijadwalkan."
      />
      <ResearchPanel accounts={accountOptions} ideas={ideaItems} />
    </>
  );
}

import { createClient } from "@/lib/supabase/server";
import { getCurrentWorkspaceId } from "@/lib/workspace";
import { PageHeader } from "@/components/page-header";
import { currentWibMonthKey, wibToUtcIso } from "@/lib/date";
import { CalendarBoard, type DraftItem, type ScheduleItem } from "./calendar-board";

export default async function KalenderPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  await getCurrentWorkspaceId();
  const sp = await searchParams;
  const monthKey = /^\d{4}-\d{2}$/.test(sp.month ?? "") ? sp.month! : currentWibMonthKey();
  const [y, m] = monthKey.split("-").map(Number);

  // UTC range covering the WIB month (first WIB midnight of this month → next month).
  const startUtc = wibToUtcIso(y, m, 1, 0, 0);
  const next = m === 12 ? { y: y + 1, m: 1 } : { y, m: m + 1 };
  const endUtc = wibToUtcIso(next.y, next.m, 1, 0, 0);

  const sb = await createClient();
  const [{ data: schedules }, { data: drafts }, { data: accountsRaw }] = await Promise.all([
    sb
      .from("schedules")
      .select("id, content_id, scheduled_at, status, contents(title, post_type)")
      .gte("scheduled_at", startUtc)
      .lt("scheduled_at", endUtc)
      .neq("status", "cancelled")
      .order("scheduled_at", { ascending: true }),
    sb
      .from("contents")
      .select("id, title, post_type, accounts(username)")
      .eq("status", "draft")
      .order("created_at", { ascending: false })
      .limit(100),
    sb.from("accounts").select("id, username, personas(count)").order("created_at", { ascending: true }),
  ]);

  const genAccounts = (accountsRaw ?? []).map((a) => ({
    id: a.id,
    username: a.username,
    hasPersona: ((a.personas as unknown as { count: number }[])?.[0]?.count ?? 0) > 0,
  }));

  const scheduleItems: ScheduleItem[] = (schedules ?? []).map((s) => {
    const c = s.contents as unknown as { title: string | null; post_type: string } | null;
    return {
      id: s.id,
      content_id: s.content_id,
      scheduled_at: s.scheduled_at,
      status: s.status,
      title: c?.title ?? null,
      post_type: c?.post_type ?? "single",
    };
  });

  const draftItems: DraftItem[] = (drafts ?? []).map((d) => {
    const a = d.accounts as unknown as { username: string | null } | null;
    return { id: d.id, title: d.title, post_type: d.post_type, username: a?.username ?? null };
  });

  return (
    <>
      <PageHeader
        eyebrow="Jadwal"
        title="Kalender"
        description="Jadwalkan konten dengan tarik-lepas, atau buat konten baru langsung di sini. Semua waktu WIB."
      />
      <CalendarBoard monthKey={monthKey} drafts={draftItems} schedules={scheduleItems} accounts={genAccounts} />
    </>
  );
}

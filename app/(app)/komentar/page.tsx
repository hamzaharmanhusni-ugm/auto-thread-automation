import { createClient } from "@/lib/supabase/server";
import { getCurrentWorkspaceId } from "@/lib/workspace";
import { PageHeader } from "@/components/page-header";
import { CommentInbox, type AccountRow, type CommentRow } from "./comment-inbox";

export default async function KomentarPage() {
  await getCurrentWorkspaceId();
  const sb = await createClient();

  const [{ data: comments }, { data: accounts }] = await Promise.all([
    sb
      .from("comments")
      .select("id, commenter_username, comment_text, ai_reply, reply_status, received_at, accounts(username), contents(title)")
      .order("received_at", { ascending: false })
      .limit(100),
    sb.from("accounts").select("id, username, auto_reply_mode").order("created_at", { ascending: true }),
  ]);

  const commentRows: CommentRow[] = (comments ?? []).map((c) => {
    const a = c.accounts as unknown as { username: string | null } | null;
    const ct = c.contents as unknown as { title: string | null } | null;
    return {
      id: c.id,
      commenter_username: c.commenter_username,
      comment_text: c.comment_text,
      ai_reply: c.ai_reply,
      reply_status: c.reply_status,
      received_at: c.received_at,
      account_username: a?.username ?? null,
      content_title: ct?.title ?? null,
    };
  });

  const accountRows: AccountRow[] = (accounts ?? []).map((a) => ({
    id: a.id,
    username: a.username,
    auto_reply_mode: a.auto_reply_mode,
  }));

  return (
    <>
      <PageHeader
        eyebrow="Auto Comment"
        title="Komentar"
        description="Kelola komentar masuk & balasan AI. Atur mode balas per akun, lalu balas manual atau biarkan AI yang membalas."
      />
      <CommentInbox accounts={accountRows} comments={commentRows} />
    </>
  );
}

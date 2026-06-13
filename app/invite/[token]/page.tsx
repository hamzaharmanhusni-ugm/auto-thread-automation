import { createClient } from "@/lib/supabase/server";
import { InviteClient } from "./invite-client";

export default async function InvitePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const supabase = await createClient();
  const { data } = await supabase.rpc("invite_info", { p_token: token });
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const info = (data ?? { valid: false }) as {
    valid?: boolean;
    accepted?: boolean;
    expired?: boolean;
    workspace_name?: string;
    role?: string;
  };

  return <InviteClient token={token} info={info} signedInEmail={user?.email ?? null} />;
}

import { redirect } from "next/navigation";
import { ShieldQuestion } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { SignOutButton } from "@/components/sign-out-button";
import { Card, CardContent } from "@/components/ui/card";

export default async function NoAccessPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Already a member? send to dashboard.
  const { data: ws } = await supabase.rpc("ensure_default_membership");
  if (ws) redirect("/dashboard");

  return (
    <div className="flex min-h-dvh items-center justify-center bg-muted/30 px-4">
      <Card className="w-full max-w-md">
        <CardContent className="flex flex-col items-center p-8 text-center">
          <div className="flex size-12 items-center justify-center rounded-full bg-warning/20 text-warning-foreground">
            <ShieldQuestion className="size-6" />
          </div>
          <h1 className="mt-4 text-xl font-bold tracking-tight">Akunmu belum punya akses</h1>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Pendaftaran ke ruang kerja ini hanya lewat undangan. Minta admin tim mengirimkan{" "}
            <span className="font-medium text-foreground">tautan undangan</span> untuk{" "}
            <span className="font-medium text-foreground">{user.email}</span>.
          </p>
          <div className="mt-6">
            <SignOutButton />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

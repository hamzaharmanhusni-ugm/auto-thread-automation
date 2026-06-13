import { Suspense } from "react";
import { Sparkles } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { LoginForm } from "./login-form";

export default async function LoginPage() {
  const supabase = await createClient();
  const { data: setupNeeded } = await supabase.rpc("is_setup_needed");
  const allowRegistration =
    process.env.USER_ALLOW_REGISTRATION === "true" || setupNeeded === true;
  const defaultAdminEmail = process.env.USER_EMAIL_DEFAULT?.trim() ?? "";

  return (
    <div className="flex min-h-dvh items-center justify-center bg-muted/30 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="flex size-11 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
            <Sparkles className="size-5" />
          </div>
          <h1 className="mt-3 text-xl font-bold tracking-tight">ThreadsGrowth AI</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {setupNeeded
              ? "Buat akun admin pertama untuk memulai."
              : "Masuk untuk mengelola otomatisasi Threads-mu."}
          </p>
        </div>
        <Suspense fallback={null}>
          <LoginForm
            allowRegistration={allowRegistration}
            setupMode={setupNeeded === true}
            defaultAdminEmail={defaultAdminEmail}
          />
        </Suspense>
      </div>
    </div>
  );
}

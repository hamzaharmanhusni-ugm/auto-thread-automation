"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { registerAccount } from "./actions";

export function LoginForm({
  allowRegistration = false,
  setupMode = false,
  defaultAdminEmail = "",
}: {
  allowRegistration?: boolean;
  setupMode?: boolean;
  defaultAdminEmail?: string;
}) {
  const router = useRouter();
  const params = useSearchParams();
  const lockEmail = setupMode && defaultAdminEmail.length > 0;
  const [email, setEmail] = useState(lockEmail ? defaultAdminEmail : "");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"login" | "signup">(setupMode ? "signup" : "login");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const supabase = createClient();
    try {
      if (mode === "signup") {
        const res = await registerAccount(email, password);
        if (!res.ok) throw new Error(res.error);
        // Auto sign-in after secure server-side registration.
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Akun admin dibuat. Selamat datang!");
        router.push("/dashboard");
        router.refresh();
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        router.push(params.get("redirect") || "/dashboard");
        router.refresh();
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Terjadi kesalahan.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="email" className="text-sm font-medium">
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              readOnly={lockEmail}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="flex h-11 w-full rounded-md border bg-background px-3 text-sm outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 read-only:bg-muted read-only:text-muted-foreground"
              placeholder="nama@email.com"
            />
            {lockEmail ? (
              <p className="text-xs text-muted-foreground">Email admin sudah ditetapkan di konfigurasi.</p>
            ) : null}
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label htmlFor="password" className="text-sm font-medium">
                Kata sandi
              </label>
              {mode === "login" ? (
                <Link href="/forgot-password" className="text-xs font-medium text-primary hover:underline">
                  Lupa kata sandi?
                </Link>
              ) : null}
            </div>
            <input
              id="password"
              type="password"
              autoComplete={mode === "signup" ? "new-password" : "current-password"}
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="flex h-11 w-full rounded-md border bg-background px-3 text-sm outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
              placeholder="••••••••"
            />
          </div>
          <Button type="submit" size="lg" className="w-full" disabled={loading}>
            {loading ? <Loader2 className="size-4 animate-spin" /> : null}
            {mode === "login" ? "Masuk" : setupMode ? "Buat akun admin" : "Buat akun"}
          </Button>
        </form>

        {allowRegistration ? (
          <p className="mt-4 text-center text-sm text-muted-foreground">
            {mode === "login" ? "Belum punya akun?" : "Sudah punya akun?"}{" "}
            <button
              type="button"
              className="font-medium text-primary hover:underline"
              onClick={() => setMode(mode === "login" ? "signup" : "login")}
            >
              {mode === "login" ? "Daftar" : "Masuk"}
            </button>
          </p>
        ) : (
          <p className="mt-4 text-center text-xs text-muted-foreground">
            Pendaftaran hanya lewat undangan admin.
          </p>
        )}
      </CardContent>
    </Card>
  );
}

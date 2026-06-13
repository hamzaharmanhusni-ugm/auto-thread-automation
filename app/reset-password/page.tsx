"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, KeyRound } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { AuthShell } from "@/components/auth-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [status, setStatus] = useState<"checking" | "ready" | "invalid">("checking");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    let active = true;

    // Recovery link arrives as ?code=... (PKCE) or via the auth state event.
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (active && (event === "PASSWORD_RECOVERY" || session)) setStatus("ready");
    });

    (async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        if (active) setStatus("ready");
        return;
      }
      const code = new URL(window.location.href).searchParams.get("code");
      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (active) setStatus(error ? "invalid" : "ready");
        return;
      }
      // Give the auth-state listener a beat (hash-token flow) before declaring invalid.
      setTimeout(() => {
        if (active) setStatus((s) => (s === "checking" ? "invalid" : s));
      }, 1500);
    })();

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) return toast.error("Konfirmasi kata sandi tidak cocok.");
    setLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      toast.success("Kata sandi diperbarui. Silakan masuk.");
      await supabase.auth.signOut();
      router.push("/login");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal memperbarui kata sandi.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell title="Atur Kata Sandi Baru">
      <Card>
        <CardContent className="pt-6">
          {status === "checking" ? (
            <div className="flex items-center justify-center gap-2 py-6 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" /> Memeriksa tautan…
            </div>
          ) : status === "invalid" ? (
            <div className="flex flex-col items-center py-4 text-center">
              <KeyRound className="size-8 text-destructive" />
              <p className="mt-3 text-sm font-medium">Tautan tidak valid atau kedaluwarsa</p>
              <p className="mt-1 text-sm text-muted-foreground">Minta tautan reset baru.</p>
              <Button asChild variant="outline" className="mt-5">
                <Link href="/forgot-password">Minta tautan baru</Link>
              </Button>
            </div>
          ) : (
            <form onSubmit={onSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label htmlFor="password" className="text-sm font-medium">
                  Kata sandi baru
                </label>
                <input
                  id="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="flex h-11 w-full rounded-md border bg-background px-3 text-sm outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
                  placeholder="••••••••"
                />
              </div>
              <div className="space-y-1.5">
                <label htmlFor="confirm" className="text-sm font-medium">
                  Ulangi kata sandi
                </label>
                <input
                  id="confirm"
                  type="password"
                  autoComplete="new-password"
                  required
                  minLength={6}
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  className="flex h-11 w-full rounded-md border bg-background px-3 text-sm outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
                  placeholder="••••••••"
                />
              </div>
              <Button type="submit" size="lg" className="w-full" disabled={loading}>
                {loading ? <Loader2 className="size-4 animate-spin" /> : null}
                Simpan kata sandi
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </AuthShell>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, MailCheck, Sparkles, XCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { registerViaInvite } from "@/app/login/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const ROLE_LABEL: Record<string, string> = { admin: "Admin", editor: "Editor", viewer: "Viewer" };

type Info = {
  valid?: boolean;
  accepted?: boolean;
  expired?: boolean;
  workspace_name?: string;
  role?: string;
};

export function InviteClient({
  token,
  info,
  signedInEmail,
}: {
  token: string;
  info: Info;
  signedInEmail: string | null;
}) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"signup" | "login">("signup");
  const [loading, setLoading] = useState(false);

  async function accept() {
    const supabase = createClient();
    const { error } = await supabase.rpc("accept_invite", { p_token: token });
    if (error) throw error;
  }

  async function onAcceptSignedIn() {
    setLoading(true);
    try {
      await accept();
      toast.success("Undangan diterima. Selamat datang!");
      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal menerima undangan.");
    } finally {
      setLoading(false);
    }
  }

  async function onSubmitAuth(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const supabase = createClient();
    try {
      if (mode === "signup") {
        const reg = await registerViaInvite(token, email, password);
        if (!reg.ok) throw new Error(reg.error);
      }
      const signIn = await supabase.auth.signInWithPassword({ email, password });
      if (signIn.error) throw signIn.error;
      await accept();
      toast.success("Undangan diterima. Selamat datang!");
      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal memproses undangan.");
    } finally {
      setLoading(false);
    }
  }

  const invalid = !info.valid;

  return (
    <div className="flex min-h-dvh items-center justify-center bg-muted/30 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="flex size-11 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
            <Sparkles className="size-5" />
          </div>
          <h1 className="mt-3 text-xl font-bold tracking-tight">Undangan Tim</h1>
        </div>

        <Card>
          <CardContent className="pt-6">
            {invalid ? (
              <div className="flex flex-col items-center py-4 text-center">
                <XCircle className="size-8 text-destructive" />
                <p className="mt-3 text-sm font-medium">Undangan tidak berlaku</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {info.accepted
                    ? "Undangan ini sudah dipakai."
                    : info.expired
                      ? "Undangan ini sudah kedaluwarsa."
                      : "Tautan undangan tidak ditemukan."}
                </p>
                <Button variant="outline" className="mt-5" onClick={() => router.push("/login")}>
                  Ke halaman masuk
                </Button>
              </div>
            ) : (
              <>
                <div className="mb-5 flex items-start gap-3 rounded-lg bg-primary/5 p-3">
                  <MailCheck className="mt-0.5 size-5 shrink-0 text-primary" />
                  <p className="text-sm">
                    Kamu diundang bergabung ke{" "}
                    <span className="font-semibold">{info.workspace_name}</span> sebagai{" "}
                    <span className="font-semibold">{ROLE_LABEL[info.role ?? ""] ?? info.role}</span>.
                  </p>
                </div>

                {signedInEmail ? (
                  <div className="space-y-3">
                    <p className="text-sm text-muted-foreground">
                      Masuk sebagai <span className="font-medium text-foreground">{signedInEmail}</span>.
                    </p>
                    <Button size="lg" className="w-full" onClick={onAcceptSignedIn} disabled={loading}>
                      {loading ? <Loader2 className="size-4 animate-spin" /> : null}
                      Terima undangan
                    </Button>
                  </div>
                ) : (
                  <form onSubmit={onSubmitAuth} className="space-y-4">
                    <div className="space-y-1.5">
                      <label htmlFor="email" className="text-sm font-medium">
                        Email
                      </label>
                      <input
                        id="email"
                        type="email"
                        autoComplete="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="flex h-11 w-full rounded-md border bg-background px-3 text-sm outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
                        placeholder="nama@email.com"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label htmlFor="password" className="text-sm font-medium">
                        Kata sandi
                      </label>
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
                      {mode === "signup" ? "Buat akun & gabung" : "Masuk & gabung"}
                    </Button>
                    <p className="text-center text-sm text-muted-foreground">
                      {mode === "signup" ? "Sudah punya akun?" : "Belum punya akun?"}{" "}
                      <button
                        type="button"
                        className="font-medium text-primary hover:underline"
                        onClick={() => setMode(mode === "signup" ? "login" : "signup")}
                      >
                        {mode === "signup" ? "Masuk" : "Daftar"}
                      </button>
                    </p>
                  </form>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

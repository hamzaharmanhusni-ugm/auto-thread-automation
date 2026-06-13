"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Loader2, MailCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { AuthShell } from "@/components/auth-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const supabase = createClient();
      const redirectTo = `${window.location.origin}/reset-password`;
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo });
      if (error) throw error;
      setSent(true);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal mengirim email.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      title="Lupa Kata Sandi"
      subtitle={sent ? undefined : "Masukkan emailmu, kami kirim tautan untuk membuat kata sandi baru."}
    >
      <Card>
        <CardContent className="pt-6">
          {sent ? (
            <div className="flex flex-col items-center py-4 text-center">
              <MailCheck className="size-8 text-success" />
              <p className="mt-3 text-sm font-medium">Email terkirim</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Cek inbox <span className="font-medium text-foreground">{email}</span> dan klik tautan reset.
                Tautan berlaku 1 jam.
              </p>
              <Button asChild variant="outline" className="mt-5">
                <Link href="/login">Kembali ke masuk</Link>
              </Button>
            </div>
          ) : (
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
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="flex h-11 w-full rounded-md border bg-background px-3 text-sm outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
                  placeholder="nama@email.com"
                />
              </div>
              <Button type="submit" size="lg" className="w-full" disabled={loading}>
                {loading ? <Loader2 className="size-4 animate-spin" /> : null}
                Kirim tautan reset
              </Button>
              <p className="text-center text-sm text-muted-foreground">
                Ingat kata sandimu?{" "}
                <Link href="/login" className="font-medium text-primary hover:underline">
                  Masuk
                </Link>
              </p>
            </form>
          )}
        </CardContent>
      </Card>
    </AuthShell>
  );
}

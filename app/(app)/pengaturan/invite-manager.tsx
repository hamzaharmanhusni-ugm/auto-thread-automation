"use client";

import { useState, useTransition } from "react";
import { Copy, Link2, Loader2, Trash2, Check, Mail } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { formatDateTimeWIB } from "@/lib/utils";
import { ROLE_LABEL } from "@/lib/status";
import { createInvite, revokeInvite } from "./actions";

const ROLES: { value: "admin" | "editor" | "viewer"; label: string; hint: string }[] = [
  { value: "editor", label: "Editor", hint: "Bisa membuat & menjadwalkan konten" },
  { value: "viewer", label: "Viewer", hint: "Hanya bisa melihat" },
  { value: "admin", label: "Admin", hint: "Akses penuh + kelola anggota" },
];

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type InviteRow = {
  id: string;
  role: string;
  token: string;
  email: string | null;
  expires_at: string;
  accepted_at: string | null;
};

export function InviteManager({ invites }: { invites: InviteRow[] }) {
  const [role, setRole] = useState<"admin" | "editor" | "viewer">("editor");
  const [email, setEmail] = useState("");
  const [pending, startTransition] = useTransition();
  const [lastLink, setLastLink] = useState<{ link: string; email: string } | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const emailValid = EMAIL_RE.test(email.trim());

  function linkFor(token: string) {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    return `${origin}/invite/${token}`;
  }

  function copy(token: string) {
    const link = linkFor(token);
    navigator.clipboard.writeText(link);
    setCopied(token);
    toast.success("Tautan undangan disalin.");
    setTimeout(() => setCopied((c) => (c === token ? null : c)), 1500);
  }

  function generate() {
    if (!emailValid) return toast.error("Masukkan email orang yang ingin kamu undang.");
    startTransition(async () => {
      const res = await createInvite(role, email.trim());
      if (res.ok && res.token) {
        const link = linkFor(res.token);
        setLastLink({ link, email: res.email ?? email.trim() });
        setEmail("");
        navigator.clipboard.writeText(link).catch(() => {});
        toast.success(`Undangan untuk ${res.email ?? email.trim()} dibuat & tautannya disalin.`);
      } else {
        toast.error(res.error ?? "Gagal membuat undangan.");
      }
    });
  }

  function revoke(id: string) {
    startTransition(async () => {
      const res = await revokeInvite(id);
      if (res.ok) toast.success("Undangan dicabut.");
      else toast.error(res.error ?? "Gagal mencabut undangan.");
    });
  }

  const pendingInvites = invites.filter((i) => !i.accepted_at);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Undang Anggota</CardTitle>
        <CardDescription>
          Buat tautan undangan lalu kirim ke rekan tim. Mereka membuat akun & langsung bergabung.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="space-y-1.5">
          <Label htmlFor="invite-email">Email yang diundang</Label>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="invite-email"
              type="email"
              inputMode="email"
              autoComplete="off"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="rekan@perusahaan.com"
              className="pl-9"
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Tautan ini sebaiknya hanya dipakai oleh email di atas.
          </p>
        </div>

        <div>
          <p className="mb-2 text-sm font-medium">Peran</p>
          <div className="flex flex-wrap gap-2">
            {ROLES.map((r) => (
              <button
                key={r.value}
                type="button"
                onClick={() => setRole(r.value)}
                className={`rounded-lg border px-3 py-2 text-left text-sm transition ${
                  role === r.value
                    ? "border-primary bg-primary/5 ring-1 ring-primary"
                    : "hover:bg-accent"
                }`}
              >
                <span className="font-medium">{r.label}</span>
                <span className="block text-xs text-muted-foreground">{r.hint}</span>
              </button>
            ))}
          </div>
        </div>

        <Button onClick={generate} disabled={pending || !emailValid}>
          {pending ? <Loader2 className="size-4 animate-spin" /> : <Link2 className="size-4" />}
          Buat tautan undangan
        </Button>

        {lastLink ? (
          <div className="space-y-1.5 rounded-lg border bg-muted/40 p-2.5">
            <p className="px-1 text-xs text-muted-foreground">
              Tautan untuk <span className="font-medium text-foreground">{lastLink.email}</span> — kirim lewat
              email/WA:
            </p>
            <div className="flex items-center gap-2">
              <code className="min-w-0 flex-1 truncate px-1 text-xs">{lastLink.link}</code>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  navigator.clipboard.writeText(lastLink.link);
                  toast.success("Disalin.");
                }}
              >
                <Copy className="size-3.5" /> Salin
              </Button>
            </div>
          </div>
        ) : null}

        {pendingInvites.length > 0 ? (
          <div>
            <p className="mb-2 text-sm font-medium">Undangan aktif</p>
            <ul className="divide-y rounded-lg border">
              {pendingInvites.map((i) => (
                <li key={i.id} className="flex items-center gap-3 px-3 py-2.5 text-sm">
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{i.email ?? "Tanpa email"}</p>
                    <p className="flex flex-wrap items-center gap-x-2 text-xs text-muted-foreground">
                      <Badge variant="secondary">{ROLE_LABEL[i.role] ?? i.role}</Badge>
                      <span>Kedaluwarsa {formatDateTimeWIB(i.expires_at)}</span>
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <Button size="sm" variant="ghost" onClick={() => copy(i.token)}>
                      {copied === i.token ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
                      Salin tautan
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      aria-label={`Cabut undangan ${i.email ?? ""}`}
                      onClick={() => revoke(i.id)}
                    >
                      <Trash2 className="size-3.5 text-destructive" />
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

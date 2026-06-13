"use client";

import { useState, useTransition } from "react";
import { Copy, Link2, Loader2, Trash2, Check } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { formatDateTimeWIB } from "@/lib/utils";
import { createInvite, revokeInvite } from "./actions";

const ROLES: { value: "admin" | "editor" | "viewer"; label: string; hint: string }[] = [
  { value: "editor", label: "Editor", hint: "Bisa membuat & menjadwalkan konten" },
  { value: "viewer", label: "Viewer", hint: "Hanya bisa melihat" },
  { value: "admin", label: "Admin", hint: "Akses penuh + kelola anggota" },
];

export type InviteRow = {
  id: string;
  role: string;
  token: string;
  expires_at: string;
  accepted_at: string | null;
};

export function InviteManager({ invites }: { invites: InviteRow[] }) {
  const [role, setRole] = useState<"admin" | "editor" | "viewer">("editor");
  const [pending, startTransition] = useTransition();
  const [lastLink, setLastLink] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

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
    startTransition(async () => {
      const res = await createInvite(role);
      if (res.ok && res.token) {
        const link = linkFor(res.token);
        setLastLink(link);
        navigator.clipboard.writeText(link).catch(() => {});
        toast.success("Tautan undangan dibuat & disalin.");
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

        <Button onClick={generate} disabled={pending}>
          {pending ? <Loader2 className="size-4 animate-spin" /> : <Link2 className="size-4" />}
          Buat tautan undangan
        </Button>

        {lastLink ? (
          <div className="flex items-center gap-2 rounded-lg border bg-muted/40 p-2">
            <code className="min-w-0 flex-1 truncate px-1 text-xs">{lastLink}</code>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                navigator.clipboard.writeText(lastLink);
                toast.success("Disalin.");
              }}
            >
              <Copy className="size-3.5" /> Salin
            </Button>
          </div>
        ) : null}

        {pendingInvites.length > 0 ? (
          <div>
            <p className="mb-2 text-sm font-medium">Undangan aktif</p>
            <ul className="divide-y rounded-lg border">
              {pendingInvites.map((i) => (
                <li key={i.id} className="flex items-center gap-2 px-3 py-2 text-sm">
                  <Badge variant="secondary">{i.role}</Badge>
                  <span className="text-xs text-muted-foreground">
                    Kedaluwarsa {formatDateTimeWIB(i.expires_at)}
                  </span>
                  <div className="ml-auto flex items-center gap-1">
                    <Button size="sm" variant="ghost" onClick={() => copy(i.token)}>
                      {copied === i.token ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
                      Salin
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      aria-label="Cabut undangan"
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

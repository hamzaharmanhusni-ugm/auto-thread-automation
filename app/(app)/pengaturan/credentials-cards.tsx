"use client";

import { useState, useTransition } from "react";
import { Eye, EyeOff, Loader2, Check, Copy, Plug, KeyRound, Bot, Link2, CalendarClock } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  saveReplizCredentials,
  testReplizConnection,
  saveAiSettings,
  saveAutomationSettings,
} from "./settings-actions";

function SecretInput({
  id,
  value,
  onChange,
  placeholder,
  autoComplete = "off",
}: {
  id: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  autoComplete?: string;
}) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <input
        id={id}
        type={show ? "text" : "password"}
        autoComplete={autoComplete}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-10 w-full rounded-md border bg-background px-3 pr-10 text-sm outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
      />
      <button
        type="button"
        aria-label={show ? "Sembunyikan" : "Tampilkan"}
        onClick={() => setShow((s) => !s)}
        className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
      >
        {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
      </button>
    </div>
  );
}

function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium">{label}</label>
      {children}
      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

export function CredentialsCards({
  hasReplizCreds,
  replizUsername,
  aiProvider,
  hasGeminiKey,
  geminiModel,
  mcpConfigured,
  postsPerDay,
  autoCommentCount,
  dailyPostHour,
}: {
  hasReplizCreds: boolean;
  replizUsername: string | null;
  aiProvider: string;
  hasGeminiKey: boolean;
  geminiModel: string | null;
  mcpConfigured: boolean;
  postsPerDay: number;
  autoCommentCount: number;
  dailyPostHour: number;
}) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <ReplizCard hasCreds={hasReplizCreds} username={replizUsername} />
      <AiCard provider={aiProvider} hasKey={hasGeminiKey} model={geminiModel} />
      <AutomationCard postsPerDay={postsPerDay} autoCommentCount={autoCommentCount} dailyPostHour={dailyPostHour} />
      <McpCard configured={mcpConfigured} />
    </div>
  );
}

function AutomationCard({
  postsPerDay,
  autoCommentCount,
  dailyPostHour,
}: {
  postsPerDay: number;
  autoCommentCount: number;
  dailyPostHour: number;
}) {
  const [ppd, setPpd] = useState(postsPerDay);
  const [acc, setAcc] = useState(autoCommentCount);
  const [hour, setHour] = useState(dailyPostHour);
  const [pending, start] = useTransition();

  function save() {
    start(async () => {
      const res = await saveAutomationSettings({ postsPerDay: ppd, autoCommentCount: acc, dailyPostHour: hour });
      if (res.ok) toast.success("Pengaturan otomasi disimpan.");
      else toast.error(res.error ?? "Gagal menyimpan.");
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <CalendarClock className="size-4 text-primary" /> Otomasi
        </CardTitle>
        <CardDescription>
          Panduan untuk MCP &amp; penjadwal. Batas aman Threads ±250 post / 24 jam per akun.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <Field label="Post per hari" hint="Target jumlah konten yang dijadwalkan tiap hari.">
          <input
            type="number"
            min={0}
            max={50}
            value={ppd}
            onChange={(e) => setPpd(Number(e.target.value))}
            className="h-10 w-full rounded-md border bg-background px-3 text-sm tabular-nums outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
          />
        </Field>
        <Field
          label="Akun auto-comment"
          hint="Berapa akun terkoneksi yang otomatis komen di tiap post (engagement). 0 = mati."
        >
          <input
            type="number"
            min={0}
            max={50}
            value={acc}
            onChange={(e) => setAcc(Number(e.target.value))}
            className="h-10 w-full rounded-md border bg-background px-3 text-sm tabular-nums outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
          />
        </Field>
        <Field label="Jam posting harian (WIB)" hint="Mulai jadwal harian dari jam ini.">
          <input
            type="number"
            min={0}
            max={23}
            value={hour}
            onChange={(e) => setHour(Number(e.target.value))}
            className="h-10 w-full rounded-md border bg-background px-3 text-sm tabular-nums outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
          />
        </Field>
        <Button onClick={save} disabled={pending}>
          {pending ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
          Simpan
        </Button>
      </CardContent>
    </Card>
  );
}

function ReplizCard({ hasCreds, username }: { hasCreds: boolean; username: string | null }) {
  const [u, setU] = useState(username ?? "");
  const [p, setP] = useState("");
  const [pending, start] = useTransition();
  const [testing, setTesting] = useState(false);

  function save() {
    start(async () => {
      const res = await saveReplizCredentials(u, p);
      if (res.ok) {
        toast.success("Kredensial Repliz disimpan.");
        setP("");
      } else toast.error(res.error ?? "Gagal menyimpan.");
    });
  }
  async function test() {
    setTesting(true);
    const res = await testReplizConnection();
    setTesting(false);
    if (res.ok) toast.success(`Koneksi OK — ${res.accounts} akun Threads ditemukan.`);
    else toast.error(res.error ?? "Koneksi gagal.");
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Plug className="size-4 text-primary" /> Koneksi Repliz
          </CardTitle>
          {hasCreds ? <Badge variant="success">Tersimpan</Badge> : <Badge variant="secondary">Belum diatur</Badge>}
        </div>
        <CardDescription>
          Repliz menghubungkan akun Threads untuk auto-jadwal & auto-balas komentar. Ambil kredensial di
          dashboard Repliz.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <Field label="Username / Access Key">
          <input
            value={u}
            onChange={(e) => setU(e.target.value)}
            placeholder="access key Repliz"
            className="h-10 w-full rounded-md border bg-background px-3 text-sm outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
          />
        </Field>
        <Field label="Password / Secret Key" hint={hasCreds ? "Biarkan kosong jika tidak ingin mengubah." : undefined}>
          <SecretInput id="repliz-pass" value={p} onChange={setP} placeholder="secret key Repliz" />
        </Field>
        <div className="flex flex-wrap gap-2 pt-1">
          <Button onClick={save} disabled={pending}>
            {pending ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
            Simpan
          </Button>
          <Button variant="outline" onClick={test} disabled={testing || !hasCreds}>
            {testing ? <Loader2 className="size-4 animate-spin" /> : <Plug className="size-4" />}
            Tes Koneksi
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function AiCard({ provider, hasKey, model }: { provider: string; hasKey: boolean; model: string | null }) {
  const [prov, setProv] = useState(provider || "gemini");
  const [key, setKey] = useState("");
  const [mdl, setMdl] = useState(model ?? "");
  const [pending, start] = useTransition();

  function save() {
    start(async () => {
      const res = await saveAiSettings({
        provider: prov as "gemini" | "openai" | "claude",
        geminiApiKey: key || undefined,
        geminiModel: mdl,
      });
      if (res.ok) {
        toast.success("Pengaturan AI disimpan.");
        setKey("");
      } else toast.error(res.error ?? "Gagal menyimpan.");
    });
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Bot className="size-4 text-primary" /> Kunci AI
          </CardTitle>
          {hasKey ? <Badge variant="success">Kunci tersimpan</Badge> : <Badge variant="secondary">Pakai .env</Badge>}
        </div>
        <CardDescription>Kunci untuk riset ide & generate konten. Dapatkan di Google AI Studio.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <Field label="Provider">
          <select
            value={prov}
            onChange={(e) => setProv(e.target.value)}
            className="h-10 w-full rounded-md border bg-background px-3 text-sm outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
          >
            <option value="gemini">Gemini (Google)</option>
          </select>
        </Field>
        <Field
          label="Gemini API Key"
          hint={hasKey ? "Sudah tersimpan. Isi untuk mengganti." : "Mulai dengan AIza…"}
        >
          <SecretInput id="gemini-key" value={key} onChange={setKey} placeholder="AIza..." />
        </Field>
        <Field label="Model (opsional)" hint="Default: gemini-2.0-flash">
          <input
            value={mdl}
            onChange={(e) => setMdl(e.target.value)}
            placeholder="gemini-2.0-flash"
            className="h-10 w-full rounded-md border bg-background px-3 text-sm outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
          />
        </Field>
        <Button onClick={save} disabled={pending}>
          {pending ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
          Simpan
        </Button>
      </CardContent>
    </Card>
  );
}

function McpCard({ configured }: { configured: boolean }) {
  const [copied, setCopied] = useState(false);
  const origin = typeof window !== "undefined" ? window.location.origin : "https://app-kamu.com";
  const snippet = `claude mcp add threadsgrowth --transport http ${origin}/api/mcp --header "Authorization: Bearer <MCP_AUTH_TOKEN>"`;

  function copy() {
    navigator.clipboard.writeText(snippet);
    setCopied(true);
    toast.success("Perintah disalin.");
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <Card className="lg:col-span-2">
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Link2 className="size-4 text-primary" /> Integrasi AI (MCP) — Claude / Codex
          </CardTitle>
          {configured ? <Badge variant="success">Aktif</Badge> : <Badge variant="secondary">Set MCP_AUTH_TOKEN</Badge>}
        </div>
        <CardDescription>
          Hubungkan ThreadsGrowth ke Claude Desktop / Claude Code agar bisa dikendalikan lewat AI. Set env{" "}
          <code className="rounded bg-muted px-1">MCP_AUTH_TOKEN</code> lalu jalankan perintah ini.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-2 rounded-lg border bg-muted/40 p-2">
          <code className="min-w-0 flex-1 truncate px-1 text-xs">{snippet}</code>
          <Button size="sm" variant="outline" onClick={copy}>
            {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />} Salin
          </Button>
        </div>
        <p className="flex items-center gap-2 text-xs text-muted-foreground">
          <KeyRound className="size-3.5" /> Panduan lengkap (Claude Desktop, Vercel & Dokploy) ada di{" "}
          <code className="rounded bg-muted px-1">docs/MCP.md</code>.
        </p>
      </CardContent>
    </Card>
  );
}

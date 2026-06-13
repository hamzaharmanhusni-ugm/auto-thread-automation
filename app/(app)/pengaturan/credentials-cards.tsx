"use client";

import { useEffect, useState, useTransition } from "react";
import { Eye, EyeOff, Loader2, Check, Plug, KeyRound, Bot, CalendarClock } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CopyBlock } from "@/components/copy-block";
import { MCP_CLIENTS, mcpConfigFor, type McpClient } from "@/lib/mcp/config";
import {
  saveReplizCredentials,
  testReplizConnection,
  saveAiSettings,
  saveAutomationSettings,
  generateMcpToken,
  saveMcpToken,
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
  mcpToken,
  mcpFromEnv,
  appUrl,
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
  mcpToken: string;
  mcpFromEnv: boolean;
  appUrl: string;
  postsPerDay: number;
  autoCommentCount: number;
  dailyPostHour: number;
}) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <ReplizCard hasCreds={hasReplizCreds} username={replizUsername} />
      <AiCard provider={aiProvider} hasKey={hasGeminiKey} model={geminiModel} />
      <AutomationCard postsPerDay={postsPerDay} autoCommentCount={autoCommentCount} dailyPostHour={dailyPostHour} />
      <McpCard configured={mcpConfigured} token={mcpToken} fromEnv={mcpFromEnv} appUrl={appUrl} />
    </div>
  );
}

function Step({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <div className="flex gap-3">
      <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[11px] font-semibold text-primary">
        {n}
      </span>
      <div className="min-w-0 flex-1 space-y-2 text-sm">{children}</div>
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

function McpTokenManager({ token, fromEnv }: { token: string; fromEnv: boolean }) {
  const [current, setCurrent] = useState(token);
  const [manual, setManual] = useState("");
  const [editing, setEditing] = useState(false);
  const [pending, start] = useTransition();

  function gen() {
    start(async () => {
      const res = await generateMcpToken();
      if (res.ok && res.token) {
        setCurrent(res.token);
        toast.success("Token baru dibuat & disimpan.");
      } else toast.error(res.error ?? "Gagal membuat token.");
    });
  }
  function saveManual() {
    start(async () => {
      const res = await saveMcpToken(manual);
      if (res.ok) {
        setCurrent(manual.trim());
        setManual("");
        setEditing(false);
        toast.success("Token disimpan.");
      } else toast.error(res.error ?? "Gagal menyimpan token.");
    });
  }

  if (fromEnv) {
    return (
      <div className="space-y-1.5">
        <p className="text-sm font-medium">Token rahasiamu</p>
        <CopyBlock text={current} label="Salin token" />
        <p className="text-xs text-muted-foreground">
          Diatur lewat environment (<code className="rounded bg-muted px-1">MCP_AUTH_TOKEN</code>), terkunci dari sini.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium">Token rahasiamu</p>
      {current ? (
        <>
          <CopyBlock text={current} label="Salin token" />
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="outline" onClick={gen} disabled={pending}>
              {pending ? <Loader2 className="size-3.5 animate-spin" /> : <KeyRound className="size-3.5" />} Generate ulang
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setEditing((e) => !e)} disabled={pending}>
              Isi manual
            </Button>
          </div>
        </>
      ) : (
        <div className="rounded-lg border border-dashed bg-muted/30 p-3">
          <p className="mb-2 text-sm text-muted-foreground">
            MCP belum aktif. Buat token dulu agar Claude/Cursor bisa tersambung.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" onClick={gen} disabled={pending}>
              {pending ? <Loader2 className="size-3.5 animate-spin" /> : <KeyRound className="size-3.5" />} Generate
              otomatis
            </Button>
            <Button size="sm" variant="outline" onClick={() => setEditing((e) => !e)} disabled={pending}>
              Isi manual
            </Button>
          </div>
        </div>
      )}
      {editing ? (
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <input
            value={manual}
            onChange={(e) => setManual(e.target.value)}
            placeholder="token-rahasia-minimal-12-karakter"
            className="h-9 min-w-0 flex-1 rounded-lg border bg-background px-3 text-sm outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40"
          />
          <Button size="sm" onClick={saveManual} disabled={pending || manual.trim().length < 12}>
            <Check className="size-3.5" /> Simpan
          </Button>
        </div>
      ) : null}
      <p className="text-xs text-muted-foreground">Anggap ini seperti password. Jangan dibagikan ke publik.</p>
    </div>
  );
}

function McpCard({
  configured,
  token,
  fromEnv,
  appUrl,
}: {
  configured: boolean;
  token: string;
  fromEnv: boolean;
  appUrl: string;
}) {
  const [origin, setOrigin] = useState(appUrl || "");
  const [client, setClient] = useState<McpClient>("Claude Desktop");
  useEffect(() => {
    if (!appUrl && typeof window !== "undefined") setOrigin(window.location.origin);
  }, [appUrl]);

  const base = (origin || "https://app-kamu.com").replace(/\/$/, "");
  const mcpUrl = `${base}/api/mcp`;
  const realToken = token || "TOKEN-BELUM-DIBUAT";
  const cfg = mcpConfigFor(client, mcpUrl, realToken);

  return (
    <Card className="lg:col-span-2">
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Bot className="size-4 text-primary" /> Kendalikan lewat AI (MCP)
          </CardTitle>
          {configured ? <Badge variant="success">Siap dipakai</Badge> : <Badge variant="warning">Belum aktif</Badge>}
        </div>
        <CardDescription>
          Sambungkan ke asisten AI favoritmu, lalu cukup bilang &ldquo;buatkan 3 ide konten untuk akun X lalu
          jadwalkan&rdquo; dan ia mengerjakannya di sini.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <McpTokenManager token={token} fromEnv={fromEnv} />

        {/* Client picker */}
        <div className="space-y-2">
          <p className="text-sm font-medium">Pilih aplikasimu</p>
          <div className="flex flex-wrap gap-2">
            {MCP_CLIENTS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setClient(c)}
                className={`rounded-lg border px-3 py-1.5 text-sm transition ${
                  client === c ? "border-primary bg-primary/5 font-medium text-primary ring-1 ring-primary" : "hover:bg-accent"
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        {/* Config for selected client */}
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">
            {cfg.file === "Terminal" ? "Jalankan perintah ini:" : `Tempel ke ${cfg.file}:`}
          </p>
          <CopyBlock text={cfg.text} label="Salin" />
          <p className="text-xs text-muted-foreground">{cfg.note}</p>
        </div>

        {!configured ? (
          <p className="rounded-lg bg-warning/10 px-3 py-2 text-xs text-warning-foreground">
            Buat token dulu di atas. Config akan otomatis memakai token aslimu setelah dibuat.
          </p>
        ) : null}

        <p className="flex items-center gap-2 text-xs text-muted-foreground">
          <KeyRound className="size-3.5 shrink-0" /> URL sudah otomatis ikut domainmu
          {origin ? <code className="rounded bg-muted px-1">{base}</code> : null}. Panduan lengkap +
          deploy ada di{" "}
          <a href="/panduan#mcp" className="font-medium text-primary underline-offset-2 hover:underline">
            Panduan
          </a>
          .
        </p>
      </CardContent>
    </Card>
  );
}

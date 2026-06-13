import { UsersRound, Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getCurrentWorkspaceId } from "@/lib/workspace";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { HelpTip } from "@/components/help-tip";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PersonaFormDialog, type PersonaEdit } from "./persona-form-dialog";
import { PersonaCardActions } from "./persona-card-actions";

export default async function PersonaPage() {
  await getCurrentWorkspaceId();
  const supabase = await createClient();
  const [{ data: personas }, { data: accountsRaw }] = await Promise.all([
    supabase
      .from("personas")
      .select(
        "id, account_id, name, description, tone, audience, cta, communication_style, niche, is_default, accounts(username)",
      )
      .order("created_at", { ascending: true }),
    supabase.from("accounts").select("id, username").order("created_at", { ascending: true }),
  ]);

  const accounts = (accountsRaw ?? []).map((a) => ({ id: a.id, username: a.username }));

  return (
    <>
      <PageHeader
        eyebrow="Merek"
        title="Persona"
        description="Karakter merek yang dipakai AI untuk membuat ide, konten, dan balasan. Tiap akun butuh minimal satu."
        action={
          <PersonaFormDialog
            accounts={accounts}
            trigger={
              <Button disabled={accounts.length === 0}>
                <Plus className="size-4" /> Buat Persona
              </Button>
            }
          />
        }
      />

      {personas && personas.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {personas.map((p) => {
            const acc = p.accounts as unknown as { username: string } | null;
            const edit: PersonaEdit = {
              id: p.id,
              account_id: p.account_id,
              name: p.name,
              niche: p.niche,
              tone: p.tone,
              audience: p.audience,
              cta: p.cta,
              communication_style: p.communication_style,
              description: p.description,
              is_default: p.is_default,
            };
            return (
              <Card key={p.id} className="flex flex-col">
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <CardTitle className="flex items-center gap-2 text-base">
                        {p.name}
                        {p.is_default ? <Badge variant="success">Utama</Badge> : null}
                      </CardTitle>
                      <CardDescription>{acc?.username ? `@${acc.username}` : "—"}</CardDescription>
                    </div>
                    <PersonaCardActions persona={edit} accounts={accounts} />
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {p.description ? (
                    <p className="line-clamp-3 text-sm text-muted-foreground">{p.description}</p>
                  ) : null}
                  <div className="flex flex-wrap gap-2">
                    {p.tone ? <Badge variant="secondary">Nada: {p.tone}</Badge> : null}
                    {p.audience ? <Badge variant="outline">{p.audience}</Badge> : null}
                    {p.niche ? <Badge>{p.niche}</Badge> : null}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <EmptyState
          icon={UsersRound}
          title={accounts.length === 0 ? "Hubungkan akun dulu" : "Belum ada persona"}
          description={
            accounts.length === 0
              ? "Persona menempel pada akun Threads. Sinkronkan akun di menu Akun dulu, lalu buat persona di sini."
              : "Buat persona agar AI tahu gaya bahasa, audiens, dan tujuan kontenmu. Contoh: 'Dokter Edukatif' dengan nada ramah."
          }
          action={
            accounts.length === 0 ? (
              <Button asChild>
                <a href="/akun">Ke menu Akun</a>
              </Button>
            ) : (
              <PersonaFormDialog
                accounts={accounts}
                trigger={
                  <Button>
                    <Plus className="size-4" /> Buat Persona Pertama
                  </Button>
                }
              />
            )
          }
        />
      )}

      <p className="mt-6 flex items-center gap-1.5 text-xs text-muted-foreground">
        <HelpTip>Persona = karakter merekmu. AI memakainya agar konten terdengar konsisten dan sesuai audiens.</HelpTip>
        Apa itu persona? Arahkan kursor ke ikon tanda tanya.
      </p>
    </>
  );
}

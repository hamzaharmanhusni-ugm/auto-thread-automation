import { UsersRound, Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getCurrentWorkspaceId } from "@/lib/workspace";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default async function PersonaPage() {
  await getCurrentWorkspaceId();
  const supabase = await createClient();
  const { data: personas } = await supabase
    .from("personas")
    .select("id, name, description, tone, audience, niche, accounts(username)")
    .order("created_at", { ascending: true });

  return (
    <>
      <PageHeader
        title="Persona"
        description="Karakter merek yang dipakai AI untuk membuat ide, konten, dan balasan."
        action={
          <Button>
            <Plus className="size-4" /> Buat Persona
          </Button>
        }
      />

      {personas && personas.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {personas.map((p) => {
            const acc = p.accounts as unknown as { username: string } | null;
            return (
              <Card key={p.id}>
                <CardHeader>
                  <CardTitle className="text-base">{p.name}</CardTitle>
                  <CardDescription>{acc?.username ? `@${acc.username}` : "—"}</CardDescription>
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
          title="Belum ada persona"
          description="Buat persona agar AI tahu gaya bahasa, audiens, dan tujuan kontenmu. Contoh: 'Dokter Edukatif' dengan nada ramah."
          action={<Button>Buat Persona Pertama</Button>}
        />
      )}
    </>
  );
}

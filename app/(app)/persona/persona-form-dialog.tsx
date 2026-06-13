"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Save, Sparkles } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { HelpTip } from "@/components/help-tip";
import { createPersona, updatePersona, type PersonaFormInput } from "./persona-actions";

const TONES = ["Ramah", "Profesional", "Santai", "Edukatif", "Inspiratif", "Tegas", "Humoris", "Empati"];

export type AccountChoice = { id: string; username: string | null };
export type PersonaEdit = {
  id: string;
  account_id: string;
  name: string;
  niche: string | null;
  tone: string | null;
  audience: string | null;
  cta: string | null;
  communication_style: string | null;
  description: string | null;
  is_default: boolean;
};

export function PersonaFormDialog({
  accounts,
  persona,
  trigger,
  defaultAccountId,
}: {
  accounts: AccountChoice[];
  persona?: PersonaEdit;
  trigger: React.ReactNode;
  defaultAccountId?: string;
}) {
  const router = useRouter();
  const isEdit = Boolean(persona);
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();

  const [form, setForm] = useState({
    accountId: persona?.account_id ?? defaultAccountId ?? accounts[0]?.id ?? "",
    name: persona?.name ?? "",
    niche: persona?.niche ?? "",
    tone: persona?.tone ?? "",
    audience: persona?.audience ?? "",
    cta: persona?.cta ?? "",
    communicationStyle: persona?.communication_style ?? "",
    description: persona?.description ?? "",
    isDefault: persona?.is_default ?? false,
  });

  function set<K extends keyof typeof form>(k: K, v: (typeof form)[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  function submit() {
    if (!form.name.trim()) return toast.error("Nama persona wajib diisi.");
    if (!isEdit && !form.accountId) return toast.error("Pilih akun dulu.");
    start(async () => {
      const payload: PersonaFormInput = {
        accountId: form.accountId,
        name: form.name,
        niche: form.niche,
        tone: form.tone,
        audience: form.audience,
        cta: form.cta,
        communicationStyle: form.communicationStyle,
        description: form.description,
        isDefault: form.isDefault,
      };
      const res = isEdit ? await updatePersona(persona!.id, payload) : await createPersona(payload);
      if (res.ok) {
        toast.success(isEdit ? "Persona diperbarui." : "Persona dibuat. Sekarang akun ini siap di-generate.");
        setOpen(false);
        router.refresh();
      } else {
        toast.error(res.error ?? "Gagal menyimpan persona.");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-h-[90dvh] max-w-xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Persona" : "Buat Persona"}</DialogTitle>
          <DialogDescription>
            Persona memberi tahu AI gaya bahasa, audiens, dan tujuan kontenmu. Makin jelas, makin bagus hasilnya.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4">
          {!isEdit ? (
            <div className="space-y-1.5">
              <Label htmlFor="p-account">Untuk akun</Label>
              <select
                id="p-account"
                value={form.accountId}
                onChange={(e) => set("accountId", e.target.value)}
                className="h-10 w-full rounded-lg border bg-background px-3 text-sm outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40"
              >
                {accounts.length === 0 ? <option value="">Belum ada akun</option> : null}
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    @{a.username ?? "akun"}
                  </option>
                ))}
              </select>
            </div>
          ) : null}

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="p-name">
                Nama persona
                <HelpTip>Label internal. Contoh: &ldquo;Dokter Edukatif&rdquo; atau &ldquo;Brand Skincare&rdquo;.</HelpTip>
              </Label>
              <Input
                id="p-name"
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
                placeholder="Dokter Edukatif"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="p-niche">Bidang / Niche</Label>
              <Input
                id="p-niche"
                value={form.niche}
                onChange={(e) => set("niche", e.target.value)}
                placeholder="Kesehatan"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="p-tone">Nada bicara</Label>
              <Input
                id="p-tone"
                list="tone-options"
                value={form.tone}
                onChange={(e) => set("tone", e.target.value)}
                placeholder="Ramah"
              />
              <datalist id="tone-options">
                {TONES.map((t) => (
                  <option key={t} value={t} />
                ))}
              </datalist>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="p-audience">Audiens</Label>
              <Input
                id="p-audience"
                value={form.audience}
                onChange={(e) => set("audience", e.target.value)}
                placeholder="Masyarakat umum"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="p-style">Gaya komunikasi</Label>
            <Input
              id="p-style"
              value={form.communicationStyle}
              onChange={(e) => set("communicationStyle", e.target.value)}
              placeholder="Bahasa sederhana, mudah dipahami, sedikit humor"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="p-cta">
              Ajakan / CTA
              <HelpTip>Aksi yang kamu mau pembaca lakukan. Contoh: &ldquo;Konsultasi lewat DM&rdquo;.</HelpTip>
            </Label>
            <Input
              id="p-cta"
              value={form.cta}
              onChange={(e) => set("cta", e.target.value)}
              placeholder="Konsultasi lewat DM"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="p-desc">Deskripsi (opsional)</Label>
            <Textarea
              id="p-desc"
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              placeholder="Ceritakan singkat soal brand/akun ini agar AI lebih paham konteksnya."
              rows={3}
            />
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.isDefault}
              onChange={(e) => set("isDefault", e.target.checked)}
              className="size-4 rounded border-input accent-primary"
            />
            Jadikan persona utama untuk akun ini
          </label>
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="ghost" disabled={pending}>
              Batal
            </Button>
          </DialogClose>
          <Button onClick={submit} disabled={pending}>
            {pending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : isEdit ? (
              <Save className="size-4" />
            ) : (
              <Sparkles className="size-4" />
            )}
            {isEdit ? "Simpan" : "Buat Persona"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

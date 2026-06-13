"use client";

import { Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { PersonaFormDialog, type AccountChoice, type PersonaEdit } from "./persona-form-dialog";
import { deletePersona } from "./persona-actions";

export function PersonaCardActions({ persona, accounts }: { persona: PersonaEdit; accounts: AccountChoice[] }) {
  return (
    <div className="flex items-center gap-1">
      <PersonaFormDialog
        accounts={accounts}
        persona={persona}
        trigger={
          <Button size="icon" variant="ghost" aria-label="Edit persona" className="size-8">
            <Pencil className="size-3.5" />
          </Button>
        }
      />
      <ConfirmDialog
        title="Hapus persona ini?"
        description={
          <>
            Persona <span className="font-medium">{persona.name}</span> akan dihapus permanen. Konten yang sudah ada
            tidak terhapus, tapi akun mungkin tidak bisa generate jika tak punya persona lain.
          </>
        }
        confirmLabel="Hapus persona"
        successMessage="Persona dihapus."
        action={() => deletePersona(persona.id)}
        trigger={
          <Button size="icon" variant="ghost" aria-label="Hapus persona" className="size-8">
            <Trash2 className="size-3.5 text-destructive" />
          </Button>
        }
      />
    </div>
  );
}

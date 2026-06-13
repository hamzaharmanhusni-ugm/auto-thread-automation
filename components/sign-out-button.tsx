"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

export function SignOutButton({ variant = "outline" }: { variant?: "outline" | "ghost" | "default" }) {
  const router = useRouter();
  async function signOut() {
    await createClient().auth.signOut();
    router.push("/login");
    router.refresh();
  }
  return (
    <Button variant={variant} onClick={signOut}>
      <LogOut className="size-4" /> Keluar
    </Button>
  );
}

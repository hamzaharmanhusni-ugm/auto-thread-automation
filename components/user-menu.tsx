"use client";

import { useRouter } from "next/navigation";
import { LogOut, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export function UserMenu({ email }: { email: string }) {
  const router = useRouter();
  const { theme, setTheme } = useTheme();

  async function signOut() {
    await createClient().auth.signOut();
    router.push("/login");
    router.refresh();
  }

  const initials = email.slice(0, 2).toUpperCase();

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="ghost"
        size="icon"
        aria-label="Ganti tema terang/gelap"
        onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      >
        <Sun className="size-4 dark:hidden" />
        <Moon className="hidden size-4 dark:block" />
      </Button>
      <div className="hidden items-center gap-2 sm:flex">
        <Avatar className="size-8">
          <AvatarFallback>{initials}</AvatarFallback>
        </Avatar>
        <span className="max-w-[160px] truncate text-sm text-muted-foreground">{email}</span>
      </div>
      <Button variant="ghost" size="icon" aria-label="Keluar" onClick={signOut}>
        <LogOut className="size-4" />
      </Button>
    </div>
  );
}

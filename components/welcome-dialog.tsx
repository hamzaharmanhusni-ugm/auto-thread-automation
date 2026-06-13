"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plug, AtSign, UsersRound, Sparkles, CalendarDays, ArrowRight } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

const KEY = "tg_onboarding_seen_v1";

const STEPS = [
  { icon: Plug, title: "Hubungkan Repliz", desc: "Sekali isi kredensial di Pengaturan." },
  { icon: AtSign, title: "Sinkronkan akun Threads", desc: "Tarik akunmu dari Repliz ke sini." },
  { icon: UsersRound, title: "Buat persona", desc: "Beri tahu AI gaya & audiensmu." },
  { icon: Sparkles, title: "Generate ide & konten", desc: "AI menulis, kamu tinggal pilih." },
  { icon: CalendarDays, title: "Jadwalkan & pantau", desc: "Tarik ke kalender, lihat hasilnya." },
];

/** One-time welcome modal. Shown until dismissed (stored in localStorage). */
export function WelcomeDialog() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    try {
      if (!localStorage.getItem(KEY)) setOpen(true);
    } catch {
      // ignore (private mode etc.)
    }
  }, []);

  function dismiss() {
    try {
      localStorage.setItem(KEY, "1");
    } catch {
      // ignore
    }
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={(o) => (o ? setOpen(true) : dismiss())}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-xl">Selamat datang di ThreadsGrowth AI 👋</DialogTitle>
          <DialogDescription>
            Tumbuhkan akun Threads-mu hampir otomatis. Cukup 5 langkah, dan kamu bisa mulai dari mana saja.
          </DialogDescription>
        </DialogHeader>

        <ol className="space-y-2.5">
          {STEPS.map((s, i) => (
            <li key={s.title} className="flex items-start gap-3">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <s.icon className="size-4" />
              </span>
              <div className="min-w-0">
                <p className="text-sm font-medium">
                  <span className="text-muted-foreground">{i + 1}.</span> {s.title}
                </p>
                <p className="text-xs text-muted-foreground">{s.desc}</p>
              </div>
            </li>
          ))}
        </ol>

        <DialogFooter className="sm:justify-between">
          <Button variant="ghost" onClick={dismiss}>
            Nanti saja
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" asChild onClick={dismiss}>
              <Link href="/panduan">Buka panduan</Link>
            </Button>
            <Button asChild onClick={dismiss}>
              <Link href="/pengaturan">
                Mulai <ArrowRight className="size-4" />
              </Link>
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

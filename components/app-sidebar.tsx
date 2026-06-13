"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  AtSign,
  UsersRound,
  Lightbulb,
  FileText,
  CalendarDays,
  MessageCircle,
  BarChart3,
  Settings,
  BookOpen,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

const nav = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/akun", label: "Akun", icon: AtSign },
  { href: "/persona", label: "Persona", icon: UsersRound },
  { href: "/riset", label: "Riset Ide", icon: Lightbulb },
  { href: "/konten", label: "Konten", icon: FileText },
  { href: "/kalender", label: "Kalender", icon: CalendarDays },
  { href: "/komentar", label: "Komentar", icon: MessageCircle },
  { href: "/analitik", label: "Analitik", icon: BarChart3 },
  { href: "/pengaturan", label: "Pengaturan", icon: Settings },
];

const guide = { href: "/panduan", label: "Panduan", icon: BookOpen };

const mobileNav = [...nav, guide];

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(href + "/");
}

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r bg-sidebar text-sidebar-foreground lg:flex">
      <div className="flex h-16 items-center gap-2.5 px-5">
        <div className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
          <Sparkles className="size-5" />
        </div>
        <span className="font-display text-[0.95rem] font-bold tracking-tight">ThreadsGrowth AI</span>
      </div>

      <nav className="flex-1 space-y-0.5 px-3 py-2">
        {nav.map((item) => {
          const active = isActive(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                active
                  ? "bg-primary/10 font-semibold text-primary"
                  : "font-medium text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground",
              )}
            >
              {active ? (
                <span className="absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full bg-primary" />
              ) : null}
              <item.icon className={cn("size-4 shrink-0", active && "text-primary")} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t p-3">
        <Link
          href={guide.href}
          className={cn(
            "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
            isActive(pathname, guide.href)
              ? "bg-primary/10 text-primary"
              : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground",
          )}
        >
          <guide.icon className="size-4 shrink-0" />
          {guide.label}
          <span className="ml-auto rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold text-primary">
            Baru di sini?
          </span>
        </Link>
      </div>
    </aside>
  );
}

/** Mobile top-bar nav (≤ lg). */
export function MobileNav() {
  const pathname = usePathname();
  return (
    <nav className="no-scrollbar flex gap-1 overflow-x-auto border-b bg-card px-2 py-2 lg:hidden">
      {mobileNav.map((item) => {
        const active = isActive(pathname, item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex flex-col items-center gap-1 rounded-md px-3 py-1.5 text-[11px] font-medium",
              active ? "text-primary" : "text-muted-foreground",
            )}
          >
            <item.icon className="size-5" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

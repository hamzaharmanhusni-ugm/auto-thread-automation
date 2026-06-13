import * as React from "react";
import { Sparkles } from "lucide-react";

/** Shared centered layout for auth pages (login, invite, forgot/reset). */
export function AuthShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-muted/30 px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="flex size-11 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
            <Sparkles className="size-5" />
          </div>
          <h1 className="mt-3 text-xl font-bold tracking-tight">{title}</h1>
          {subtitle ? <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{subtitle}</p> : null}
        </div>
        {children}
      </div>
    </div>
  );
}

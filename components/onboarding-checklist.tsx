import Link from "next/link";
import { CheckCircle2, Circle, ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export type ChecklistStep = { label: string; hint: string; done: boolean; href: string; cta: string };

/**
 * Data-driven getting-started checklist. Renders nothing once every step is done,
 * so it disappears on its own as the user completes setup.
 */
export function OnboardingChecklist({ steps }: { steps: ChecklistStep[] }) {
  const doneCount = steps.filter((s) => s.done).length;
  if (doneCount === steps.length) return null;

  const next = steps.find((s) => !s.done);
  const pct = Math.round((doneCount / steps.length) * 100);

  return (
    <Card className="mb-6 border-primary/30 bg-gradient-to-br from-primary/5 to-transparent">
      <CardContent className="p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="font-display text-base font-semibold tracking-tight">Ayo mulai 🚀</p>
            <p className="text-sm text-muted-foreground">
              {doneCount} dari {steps.length} langkah selesai. {next ? `Lanjut: ${next.label}.` : ""}
            </p>
          </div>
          <span className="text-sm font-semibold tabular-nums text-primary">{pct}%</span>
        </div>

        <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-primary/15">
          <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${pct}%` }} />
        </div>

        <ul className="mt-4 space-y-1.5">
          {steps.map((s) => (
            <li key={s.label}>
              <Link
                href={s.href}
                className="group flex items-center gap-3 rounded-lg px-2 py-1.5 transition-colors hover:bg-primary/5"
              >
                {s.done ? (
                  <CheckCircle2 className="size-5 shrink-0 text-success" />
                ) : (
                  <Circle className="size-5 shrink-0 text-muted-foreground/50" />
                )}
                <div className="min-w-0 flex-1">
                  <p className={`text-sm font-medium ${s.done ? "text-muted-foreground line-through" : ""}`}>
                    {s.label}
                  </p>
                  {!s.done ? <p className="text-xs text-muted-foreground">{s.hint}</p> : null}
                </div>
                {!s.done ? (
                  <span className="flex items-center gap-1 text-xs font-medium text-primary opacity-0 transition group-hover:opacity-100">
                    {s.cta} <ArrowRight className="size-3.5" />
                  </span>
                ) : null}
              </Link>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

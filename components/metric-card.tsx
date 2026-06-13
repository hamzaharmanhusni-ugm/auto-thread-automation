import * as React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { cn, formatNumber } from "@/lib/utils";

export function MetricCard({
  label,
  value,
  icon: Icon,
  hint,
  suffix,
  tone = "default",
}: {
  label: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
  hint?: string;
  suffix?: string;
  tone?: "default" | "success" | "warning" | "danger";
}) {
  const toneClass = {
    default: "bg-primary/10 text-primary",
    success: "bg-success/15 text-success",
    warning: "bg-warning/20 text-warning-foreground",
    danger: "bg-destructive/10 text-destructive",
  }[tone];

  return (
    <Card className="transition-shadow hover:shadow-md">
      <CardContent className="flex items-center gap-4 p-5">
        <div className={cn("flex size-11 shrink-0 items-center justify-center rounded-xl", toneClass)}>
          <Icon className="size-5" />
        </div>
        <div className="min-w-0">
          <p className="eyebrow truncate">{label}</p>
          <p className="mt-1 font-display text-[1.75rem] font-bold leading-none tracking-tight tabular-nums">
            {formatNumber(value)}
            {suffix ? (
              <span className="ml-0.5 text-lg font-semibold text-muted-foreground">{suffix}</span>
            ) : null}
          </p>
          {hint ? <p className="mt-1.5 truncate text-xs text-muted-foreground">{hint}</p> : null}
        </div>
      </CardContent>
    </Card>
  );
}

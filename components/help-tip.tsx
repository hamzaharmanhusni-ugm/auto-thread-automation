"use client";

import * as React from "react";
import { HelpCircle } from "lucide-react";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

/**
 * Small "?" affordance that explains a term in one plain sentence on hover/tap.
 * Use next to jargon (Persona, MCP, Repliz, Skor viral, Auto-comment).
 */
export function HelpTip({
  children,
  className,
  label = "Bantuan",
}: {
  children: React.ReactNode;
  className?: string;
  label?: string;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          aria-label={label}
          className={cn(
            "inline-flex size-4 items-center justify-center rounded-full text-muted-foreground/70 transition hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            className,
          )}
        >
          <HelpCircle className="size-3.5" />
        </button>
      </TooltipTrigger>
      <TooltipContent className="max-w-[15rem] leading-relaxed">{children}</TooltipContent>
    </Tooltip>
  );
}

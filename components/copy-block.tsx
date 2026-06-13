"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

/** A code/text block with a copy button. Wraps long content. */
export function CopyBlock({ text, label = "Salin" }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="flex items-start gap-2 rounded-lg border bg-muted/40 p-2">
      <pre className="min-w-0 flex-1 overflow-x-auto whitespace-pre-wrap break-all px-1 py-0.5 text-xs leading-relaxed">
        {text}
      </pre>
      <Button
        size="sm"
        variant="outline"
        className="shrink-0"
        onClick={() => {
          navigator.clipboard.writeText(text);
          setCopied(true);
          toast.success("Disalin.");
          setTimeout(() => setCopied(false), 1500);
        }}
      >
        {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />} {label}
      </Button>
    </div>
  );
}

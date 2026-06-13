import { Badge } from "@/components/ui/badge";
import {
  contentStatusLabel,
  scheduleStatusLabel,
  replyStatusLabel,
} from "@/lib/status";

type Kind = "content" | "schedule" | "reply";

const maps = {
  content: contentStatusLabel,
  schedule: scheduleStatusLabel,
  reply: replyStatusLabel,
};

export function StatusBadge({ kind, status }: { kind: Kind; status: string }) {
  const entry = maps[kind][status] ?? { label: status, variant: "secondary" as const };
  return <Badge variant={entry.variant}>{entry.label}</Badge>;
}

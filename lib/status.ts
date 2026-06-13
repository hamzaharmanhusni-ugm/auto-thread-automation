// Maps DB enum values to friendly Bahasa Indonesia labels + badge variants,
// so non-technical users never see raw enum strings.

type BadgeVariant = "default" | "secondary" | "success" | "warning" | "destructive" | "outline";

export const contentStatusLabel: Record<string, { label: string; variant: BadgeVariant }> = {
  draft: { label: "Draf", variant: "secondary" },
  scheduled: { label: "Terjadwal", variant: "default" },
  posted: { label: "Sudah Tayang", variant: "success" },
  failed: { label: "Gagal", variant: "destructive" },
  deleted: { label: "Dihapus", variant: "outline" },
};

export const scheduleStatusLabel: Record<string, { label: string; variant: BadgeVariant }> = {
  pending: { label: "Menunggu", variant: "secondary" },
  scheduled: { label: "Terjadwal", variant: "default" },
  posted: { label: "Sudah Tayang", variant: "success" },
  failed: { label: "Gagal", variant: "destructive" },
  cancelled: { label: "Dibatalkan", variant: "outline" },
};

export const replyStatusLabel: Record<string, { label: string; variant: BadgeVariant }> = {
  pending: { label: "Menunggu", variant: "secondary" },
  approved: { label: "Disetujui", variant: "default" },
  replied: { label: "Sudah Dibalas", variant: "success" },
  failed: { label: "Gagal", variant: "destructive" },
  skipped: { label: "Dilewati", variant: "outline" },
};

export const autoReplyModeLabel: Record<string, string> = {
  manual: "Manual",
  semi_auto: "Semi Otomatis",
  full_auto: "Otomatis Penuh",
};

export const postTypeLabel: Record<string, string> = {
  single: "Single",
  thread: "Nested (Thread)",
};

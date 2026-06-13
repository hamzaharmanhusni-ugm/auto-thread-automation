import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Format a number with Indonesian locale grouping (e.g. 1.234). */
export function formatNumber(n: number | null | undefined): string {
  return new Intl.NumberFormat("id-ID").format(n ?? 0);
}

/** Format an ISO timestamp into a friendly Indonesian date-time (WIB). */
export function formatDateTimeWIB(iso: string | null | undefined): string {
  if (!iso) return "—";
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Jakarta",
  }).format(new Date(iso));
}

// WIB (Asia/Jakarta) date helpers shared by server + client (pure functions).

const WIB_TZ = "Asia/Jakarta";

export type WibParts = {
  year: number;
  month: number; // 1-12
  day: number;
  hour: number;
  minute: number;
  dateKey: string; // YYYY-MM-DD (WIB)
};

const pad = (n: number) => String(n).padStart(2, "0");

/** Break a UTC ISO instant into its WIB calendar parts. */
export function wibParts(iso: string): WibParts {
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: WIB_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  });
  const p = Object.fromEntries(fmt.formatToParts(new Date(iso)).map((x) => [x.type, x.value]));
  const year = Number(p.year);
  const month = Number(p.month);
  const day = Number(p.day);
  return {
    year,
    month,
    day,
    hour: Number(p.hour),
    minute: Number(p.minute),
    dateKey: `${year}-${pad(month)}-${pad(day)}`,
  };
}

/** Current WIB month as "YYYY-MM". */
export function currentWibMonthKey(): string {
  const now = wibParts(new Date().toISOString());
  return `${now.year}-${pad(now.month)}`;
}

/** Convert a WIB wall-clock time to a UTC ISO string (WIB = UTC+7). */
export function wibToUtcIso(year: number, month1: number, day: number, hour: number, minute: number): string {
  return new Date(Date.UTC(year, month1 - 1, day, hour, minute) - 7 * 60 * 60 * 1000).toISOString();
}

/** "HH.mm" WIB label for a UTC instant (Indonesian uses '.' as time separator). */
export function wibTimeLabel(iso: string): string {
  const p = wibParts(iso);
  return `${pad(p.hour)}.${pad(p.minute)}`;
}

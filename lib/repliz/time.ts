// WIB (Asia/Jakarta, UTC+7) <-> UTC helpers.
// Schedules are stored in UTC; the calendar UI works in WIB. Convert once at save.

const WIB_OFFSET_MS = 7 * 60 * 60 * 1000;

/** Treat a "naive" wall-clock time (as entered in WIB) and return the UTC ISO string. */
export function wibWallClockToUtcIso(year: number, month1: number, day: number, hour = 0, minute = 0): string {
  // month1 is 1-based. Build the UTC instant for that WIB wall-clock time.
  const asUtcMs = Date.UTC(year, month1 - 1, day, hour, minute) - WIB_OFFSET_MS;
  return new Date(asUtcMs).toISOString();
}

/** Format a UTC instant for display in WIB. */
export function utcToWibLabel(iso: string): string {
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Jakarta",
  }).format(new Date(iso));
}

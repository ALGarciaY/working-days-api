import axios from "axios";
import { HolidayResponse } from "../types";

const HOLIDAYS_URL = "https://content.capta.co/Recruitment/WorkingDays.json";

/**
 * Cached holidays + last fetch timestamp to avoid requesting every call.
 */
let cache: { holidays: HolidayResponse; fetchedAt: number } | null = null;

/**
 * Fetch holidays (with 1h cache)
 */
export async function fetchHolidays(): Promise<HolidayResponse> {
  const ONE_HOUR = 1000 * 60 * 60;
  const now = Date.now();

  if (cache && now - cache.fetchedAt < ONE_HOUR) {
    return cache.holidays;
  }

  try {
    const res = await axios.get<HolidayResponse>(HOLIDAYS_URL, { timeout: 5000 });
    if (!Array.isArray(res.data)) throw new Error("Remote holidays payload is not an array");
    // Normalize to strings (yyyy-MM-dd)
    const holidays = res.data.map((d) => String(d));
    cache = { holidays, fetchedAt: now };
    return holidays;
  } catch (err) {
    // If fetch fails, throw so caller can return 503 or decide fallback
    const message = err instanceof Error ? err.message : "Unknown error";
    throw new Error(`Failed to fetch holidays: ${message}`);
  }
}

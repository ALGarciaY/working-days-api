import axios from "axios";
import { HolidayResponse } from "../types";
import { CONFIG } from "../config";

let cache: { holidays: HolidayResponse; fetchedAt: number } | null = null;

export async function fetchHolidays(): Promise<HolidayResponse> {
  const ONE_HOUR = 1000 * 60 * 60;
  const now = Date.now();

  if (cache && now - cache.fetchedAt < ONE_HOUR) {
    return cache.holidays;
  }

  try {
    if (!CONFIG.HOLIDAYS_URL) {
      throw new Error("Variable de entorno HOLIDAYS_URL no está definida");
    }
    const res = await axios.get<HolidayResponse>(CONFIG.HOLIDAYS_URL, { timeout: 5000 });
    if (!Array.isArray(res.data)) throw new Error("la respuesta Holidays no es un array");
    const holidays = res.data.map((d) => String(d));
    cache = { holidays, fetchedAt: now };
    return holidays;
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error desconocido";
    throw new Error(`Failed to fetch holidays: ${message}`);
  }
}

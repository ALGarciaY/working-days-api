import { Request, Response } from "express";
import { fetchHolidays } from "../services/holidayService";
import { DateTime } from "luxon";
import {
  normalizeBackwardToWorking,
  addWorkingDays,
  addWorkingHours
} from "../domain/dateService";
import { ApiError, DateQuery, DateResponse} from "../types";
import { CONFIG } from "../config";

export async function calcularFechaController(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const { days: daysParam, hours: hoursParam, date: dateParam } =
      req.query as DateQuery;

    if (!daysParam && !hoursParam) {
      const err: ApiError = {
        error: "InvalidParameters",
        message: "Debes enviar 'days' o 'hours' en query string."
      };
      res.status(400).json(err);
      return;
    }

    const days: number = daysParam ? parseInt(`${daysParam}`, 10) : 0;
    const hours: number = hoursParam ? parseInt(`${hoursParam}`, 10) : 0;

    if (
      (daysParam && (isNaN(days) || days < 0)) ||
      (hoursParam && (isNaN(hours) || hours < 0))
    ) {
      const err: ApiError = {
        error: "InvalidParameters",
        message: "'days' y 'hours' deben ser enteros positivos."
      };
      res.status(400).json(err);
      return;
    }

    let startUtc: DateTime;
    if (dateParam) {
      if (!dateParam.endsWith("Z")) {
        const err: ApiError = {
          error: "InvalidParameters",
          message: "'date' debe ser ISO 8601 en UTC con sufijo Z."
        };
        res.status(400).json(err);
        return;
      }
      const parsed = DateTime.fromISO(dateParam, { zone: "utc" });
      if (!parsed.isValid) {
        const err: ApiError = {
          error: "InvalidParameters",
          message: "'date' no es una fecha ISO válida."
        };
        res.status(400).json(err);
        return;
      }
      startUtc = parsed;
    } else {
      startUtc = DateTime.now().toUTC();
    }

    let holidays: string[];
    try {
      holidays = await fetchHolidays();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Error obteniendo festivos";
      const e: ApiError = { error: "ServiceUnavailable", message };
      res.status(503).json(e);
      return;
    }

    let currentBogota = startUtc.setZone(CONFIG.BOGOTA_TZ);
    currentBogota = normalizeBackwardToWorking(currentBogota, holidays);

    if (days > 0) {
      currentBogota = addWorkingDays(currentBogota, days, holidays);
    }
    if (hours > 0) {
      currentBogota = addWorkingHours(currentBogota, hours, holidays);
    }

    const resultUtcIso: string = currentBogota
      .setZone("utc")
      .toISO({ suppressMilliseconds: true }) as string;

    const response: DateResponse = { date: resultUtcIso };
    res.status(200).json(response);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unexpected error";
    const e: ApiError = { error: "InternalError", message };
    res.status(500).json(e);
  }
}

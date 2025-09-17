import { DateTime } from "luxon";
import { HolidayResponse } from "../types";
import { CONFIG } from "../config";

const WORK_START = 8;   // Inicio de jornada (08:00)
const LUNCH_START = 12; // Inicio del almuerzo (12:00)
const LUNCH_END = 13;   // Fin del almuerzo (13:00)
const WORK_END = 17;    // Fin de jornada (17:00)

export function isHoliday(dt: DateTime, holidays: HolidayResponse): boolean {
  const isoDate: string | null = dt.toISODate();
  return isoDate ? holidays.includes(isoDate) : false;
}

export function isWorkingDay(dt: DateTime, holidays: HolidayResponse): boolean {
  const weekday: number = dt.weekday; // 1 = Lunes, ..., 7 = Domingo
  if (weekday >= 6) return false;
  return !isHoliday(dt, holidays);
}

export function normalizeBackwardToWorking(
  dtInput: DateTime,
  holidays: HolidayResponse
): DateTime {
  let dt: DateTime = dtInput.setZone(CONFIG.BOGOTA_TZ);

  if (!isWorkingDay(dt, holidays)) {
    let cursor: DateTime = dt.startOf("day").minus({ days: 1 });
    while (!isWorkingDay(cursor, holidays)) {
      cursor = cursor.minus({ days: 1 });
    }
    return cursor.set({ hour: WORK_END, minute: 0, second: 0, millisecond: 0 });
  }

  if (dt.hour > WORK_END || (dt.hour === WORK_END && dt.minute > 0)) {
    return dt.set({ hour: WORK_END, minute: 0, second: 0, millisecond: 0 });
  }

  if (
    (dt.hour === LUNCH_START && dt.minute > 0) ||
    (dt.hour > LUNCH_START && dt.hour < LUNCH_END)
  ) {
    return dt.set({ hour: LUNCH_START, minute: 0, second: 0, millisecond: 0 });
  }

  if (dt.hour < WORK_START) {
    let cursor: DateTime = dt.startOf("day").minus({ days: 1 });
    while (!isWorkingDay(cursor, holidays)) {
      cursor = cursor.minus({ days: 1 });
    }
    return cursor.set({ hour: WORK_END, minute: 0, second: 0, millisecond: 0 });
  }

  return dt.set({ second: 0, millisecond: 0 });
}

export function addWorkingDays(
  dtInput: DateTime,
  daysToAdd: number,
  holidays: HolidayResponse
): DateTime {
  if (daysToAdd <= 0) return dtInput;

  let cursor: DateTime = dtInput.setZone(CONFIG.BOGOTA_TZ);
  const hour: number = cursor.hour;
  const minute: number = cursor.minute;

  for (let i = 0; i < daysToAdd; i++) {
    cursor = cursor.plus({ days: 1 }).set({ hour, minute, second: 0, millisecond: 0 });
    while (!isWorkingDay(cursor, holidays)) {
      cursor = cursor.plus({ days: 1 }).set({ hour, minute, second: 0, millisecond: 0 });
    }
  }

  return cursor;
}

export function addWorkingHours(
  dtInput: DateTime,
  hoursToAdd: number,
  holidays: HolidayResponse
): DateTime {
  if (hoursToAdd <= 0) return dtInput;

  let cursor: DateTime = dtInput.setZone(CONFIG.BOGOTA_TZ);
  let remainingMinutes: number = hoursToAdd * 60;

  while (remainingMinutes > 0) {
    if (!isWorkingDay(cursor, holidays)) {
      let next: DateTime = cursor.plus({ days: 1 }).startOf("day");
      while (!isWorkingDay(next, holidays)) {
        next = next.plus({ days: 1 });
      }
      cursor = next.set({ hour: WORK_START, minute: 0, second: 0, millisecond: 0 });
      continue;
    }

    if (cursor.hour < WORK_START) {
      cursor = cursor.set({ hour: WORK_START, minute: 0, second: 0, millisecond: 0 });
      continue;
    }

    if (
      (cursor.hour === LUNCH_START && cursor.minute > 0) ||
      (cursor.hour > LUNCH_START && cursor.hour < LUNCH_END)
    ) {
      cursor = cursor.set({ hour: LUNCH_END, minute: 0, second: 0, millisecond: 0 });
      continue;
    }

    if (cursor.hour > WORK_END || (cursor.hour === WORK_END && cursor.minute > 0)) {
      let next: DateTime = cursor.plus({ days: 1 }).startOf("day");
      while (!isWorkingDay(next, holidays)) {
        next = next.plus({ days: 1 });
      }
      cursor = next.set({ hour: WORK_START, minute: 0, second: 0, millisecond: 0 });
      continue;
    }

    const segmentEndHour: number =
      cursor.hour < LUNCH_START || (cursor.hour === LUNCH_START && cursor.minute === 0)
        ? LUNCH_START
        : WORK_END;

    const segmentEnd: DateTime = cursor.set({
      hour: segmentEndHour,
      minute: 0,
      second: 0,
      millisecond: 0,
    });

    const availableMinutes: number = Math.max(
      0,
      Math.round(segmentEnd.diff(cursor, "minutes").minutes)
    );

    if (availableMinutes === 0) {
      if (segmentEndHour === LUNCH_START) {
        cursor = cursor.set({ hour: LUNCH_END, minute: 0, second: 0, millisecond: 0 });
      } else {
        let next: DateTime = cursor.plus({ days: 1 }).startOf("day");
        while (!isWorkingDay(next, holidays)) {
          next = next.plus({ days: 1 });
        }
        cursor = next.set({ hour: WORK_START, minute: 0, second: 0, millisecond: 0 });
      }
      continue;
    }

    if (remainingMinutes <= availableMinutes) {
      cursor = cursor.plus({ minutes: remainingMinutes });
      remainingMinutes = 0;
    } else {
      remainingMinutes -= availableMinutes;
      cursor = segmentEnd;
      if (segmentEndHour === LUNCH_START) {
        cursor = cursor.set({ hour: LUNCH_END, minute: 0, second: 0, millisecond: 0 });
      } else {
        let next: DateTime = cursor.plus({ days: 1 }).startOf("day");
        while (!isWorkingDay(next, holidays)) {
          next = next.plus({ days: 1 });
        }
        cursor = next.set({ hour: WORK_START, minute: 0, second: 0, millisecond: 0 });
      }
    }
  }

  return cursor;
}

import dotenv from "dotenv";

dotenv.config();

export const CONFIG = {
  BOGOTA_TZ: process.env.BOGOTA_TZ || "America/Bogota",
  HOLIDAYS_URL: process.env.HOLIDAYS_URL || "https://content.capta.co/Recruitment/WorkingDays.json",
} as const;

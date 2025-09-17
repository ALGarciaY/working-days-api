export interface DateResponse{
  date: string;
}

export interface DateQuery {
  days?: number;
  hours?: number;
  date?: string;
}

export interface ApiError {
  error: "InvalidParameters" | "ServiceUnavailable" | "InternalError";
  message: string;
}

export type HolidayResponse = string[];
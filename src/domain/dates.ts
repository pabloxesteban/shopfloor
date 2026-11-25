import { z } from "zod";

/**
 * Calendar dates are plain ISO strings (YYYY-MM-DD) and timestamps are ISO
 * strings in UTC. All arithmetic happens in UTC so the server and the browser
 * always agree on what day it is.
 */
export const IsoDateSchema = z.iso.date({ error: "Use a valid date (YYYY-MM-DD)" });
export const IsoDateTimeSchema = z.iso.datetime();

/**
 * The dataset is generated around a fixed "today" so screenshots, KPIs and
 * tests do not drift as real time passes.
 */
export const BUSINESS_TODAY = "2026-11-18";

const DAY_MS = 24 * 60 * 60 * 1000;

export function parseIsoDate(iso: string): Date {
  return new Date(`${iso.slice(0, 10)}T00:00:00.000Z`);
}

export function toIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function addDays(iso: string, days: number): string {
  return toIsoDate(new Date(parseIsoDate(iso).getTime() + days * DAY_MS));
}

export function daysBetween(from: string, to: string): number {
  return Math.round((parseIsoDate(to).getTime() - parseIsoDate(from).getTime()) / DAY_MS);
}

/** Monday of the ISO week that contains `iso`. */
export function startOfWeek(iso: string): string {
  const day = parseIsoDate(iso).getUTCDay(); // 0 = Sunday
  const offset = day === 0 ? -6 : 1 - day;
  return addDays(iso, offset);
}

export function startOfMonth(iso: string): string {
  return `${iso.slice(0, 7)}-01`;
}

const dateFormat = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

const shortDateFormat = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  timeZone: "UTC",
});

export function formatDate(iso: string): string {
  return dateFormat.format(parseIsoDate(iso));
}

export function formatShortDate(iso: string): string {
  return shortDateFormat.format(parseIsoDate(iso));
}

import type { ClubEvent } from "@/data/events";
import { siteConfig } from "@/data/site";

export const TIMEZONE = "Africa/Algiers";

const HOUR = 60 * 60 * 1000;
export const DAY = 24 * HOUR;
const DEFAULT_DURATION = 3 * HOUR;

export const startMs = (e: ClubEvent) => new Date(e.start).getTime();
export const endMs = (e: ClubEvent) =>
  e.end ? new Date(e.end).getTime() : startMs(e) + DEFAULT_DURATION;

/** Upcoming = not finished yet (so an event happening right now still counts) */
export function splitEvents(list: ClubEvent[], now: number) {
  const upcoming = list
    .filter((e) => endMs(e) > now)
    .sort((a, b) => startMs(a) - startMs(b));
  const past = list
    .filter((e) => endMs(e) <= now)
    .sort((a, b) => startMs(b) - startMs(a));
  return { upcoming, past };
}

const dayKey = (ms: number) =>
  new Intl.DateTimeFormat("en-CA", { timeZone: TIMEZONE }).format(ms); // YYYY-MM-DD

const dayNumber = (key: string) => {
  const [y, m, d] = key.split("-").map(Number);
  return Date.UTC(y, m - 1, d) / DAY;
};

/** "Happening now", "Today", "Tomorrow", "In 3 days", or null when it's further away */
export function relativeLabel(e: ClubEvent, now: number): string | null {
  if (now >= startMs(e) && now < endMs(e)) return "Happening now";
  if (endMs(e) <= now) return null;

  const diff = dayNumber(dayKey(startMs(e))) - dayNumber(dayKey(now));
  if (diff === 0) return "Today";
  if (diff === 1) return "Tomorrow";
  if (diff <= 6) return `In ${diff} days`;
  return null;
}

const dateFmt = new Intl.DateTimeFormat("en-GB", {
  timeZone: TIMEZONE,
  weekday: "short",
  day: "numeric",
  month: "short",
});

const timeFmt = new Intl.DateTimeFormat("en-GB", {
  timeZone: TIMEZONE,
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

export function dateParts(e: ClubEvent) {
  const parts = dateFmt.formatToParts(startMs(e));
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  return { weekday: get("weekday"), day: get("day"), month: get("month") };
}

export function timeRange(e: ClubEvent) {
  const start = timeFmt.format(startMs(e));
  return e.end ? `${start} – ${timeFmt.format(endMs(e))}` : start;
}

/** Opens the event in Google Calendar (works on phones too) */
export function calendarUrl(e: ClubEvent) {
  const stamp = (ms: number) =>
    new Date(ms).toISOString().replace(/[-:]|\.\d{3}/g, ""); // 20261024T160000Z

  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: `${e.title} · ${siteConfig.name}`,
    dates: `${stamp(startMs(e))}/${stamp(endMs(e))}`,
    details: e.description,
    location: `${siteConfig.name}, ${siteConfig.city}`,
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

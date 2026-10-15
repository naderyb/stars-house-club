import { dayNames, hours } from "@/data/visit";

const DAY_INDEX: Record<string, number> = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
};

const toMinutes = (t: string) => {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
};

export interface AlgiersNow {
  day: number;
  minutes: number;
}

/** Current weekday and minutes in Algiers, whatever the visitor's timezone is */
export function nowInAlgiers(): AlgiersNow {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Africa/Algiers",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date());
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  return {
    day: DAY_INDEX[get("weekday")],
    minutes: Number(get("hour")) * 60 + Number(get("minute")),
  };
}

export function getStatus(now: AlgiersNow): { open: boolean; text: string } {
  const today = hours[now.day];

  if (
    today &&
    now.minutes >= toMinutes(today.open) &&
    now.minutes < toMinutes(today.close)
  ) {
    return { open: true, text: `Open now · until ${today.close}` };
  }
  if (today && now.minutes < toMinutes(today.open)) {
    return { open: false, text: `Closed · opens today at ${today.open}` };
  }
  for (let i = 1; i <= 7; i++) {
    const d = (now.day + i) % 7;
    const next = hours[d];
    if (next) {
      const when = i === 1 ? "tomorrow" : dayNames[d];
      return { open: false, text: `Closed · opens ${when} at ${next.open}` };
    }
  }
  return { open: false, text: "Closed" };
}

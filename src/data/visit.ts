import { siteConfig } from "./site";

/* ---------- address (TODO: replace everything here) ---------- */
export const address = {
  lines: ["TODO(not sure about the addr, i'll do it later)", "Algiers"],
  landmark: "TODO(it's near hedik l'association fkhardjia, mais i need to find a better addr)",
};

/** TODO: exact coordinates of the house (right click the pin in Google Maps) */
export const coords = { lat: 36.7538, lng: 3.0588 };

/** Google Maps share link to the pin. Paste it in site.ts as `mapsUrl` */
export const directionsUrl = siteConfig.mapsUrl;

/** TODO: Google Maps > Share > Embed a map > copy ONLY the src="..." value */
export const mapEmbedSrc = "";

/* ---------- opening hours ---------- */
export interface DayHours {
  /** 24h "HH:MM". Close must be later than open on the same day */
  open: string;
  close: string;
}

/** Index = JS weekday: 0 Sun, 1 Mon, ... 6 Sat. Use null for a closed day.
 *  TODO: replace with the real hours */
export const hours: (DayHours | null)[] = [
  { open: "10:00", close: "22:00" }, // Sun
  { open: "10:00", close: "22:00" }, // Mon
  { open: "10:00", close: "22:00" }, // Tue
  { open: "10:00", close: "22:00" }, // Wed
  { open: "10:00", close: "22:00" }, // Thu
  { open: "14:00", close: "22:00" }, // Fri
  { open: "10:00", close: "22:00" }, // Sat
];

export const dayNames = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

/** Display order of the table: the Algerian week starts on Saturday */
export const weekOrder = [6, 0, 1, 2, 3, 4, 5];

/* ---------- how to find us ---------- */
export interface FindStep {
  title: string;
  text: string;
  /** photo in /public/images */
  image?: string;
  alt?: string;
  /** short mp4 in /public/videos, with an optional poster image */
  video?: string;
  poster?: string;
}

/** TODO: write the real way, from the easiest landmark to the door */
export const findSteps: FindStep[] = [
  {
    title: "Start at the landmark",
    text: "TODO: the easiest place to start from (a shop, a metro station, a street corner).",
  },
  {
    title: "Follow the street",
    text: "TODO: which way to walk, what you'll pass on the way.",
  },
  {
    title: "Spot the entrance",
    text: "TODO: what the door looks like, which floor, any sign to look for.",
  },
  {
    title: "You made it",
    text: "Push the door. Welcome home ♥",
  },
];

/* ---------- house rules ---------- */
export const rules = [
  {
    title: "Respect the place",
    text: "Treat the house like your own home. Leave it a little better than you found it.",
  },
  {
    title: "Respect the art",
    text: "Look, admire, ask. Never touch or move someone's work without asking.",
  },
  {
    title: "Respect the people",
    text: "Every voice matters here. Be kind, give space, make room.",
  },
];

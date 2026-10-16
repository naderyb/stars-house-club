import { siteConfig } from "./site";

export const address = {
  lines: ["Rue Naudot, Sidi M'Hamed", "Algiers"],
  landmark:
    "in front of Association EL FAKHARDJIA, 5 rue des frères Kechacha (ex-rue Naudot, Alger-Centre, Sidi M'Hamed)",
};

export const coords = { lat: 36.76187939062471, lng: 3.0496709250872054 };

/** Google Maps share link to the pin. Paste it in site.ts as `mapsUrl` */
export const directionsUrl = siteConfig.mapsUrl;

export const mapEmbedSrc =
  "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3196.3680327407524!2d3.0470852757351237!3d36.76173756986685!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x128fb32e7f42cec1%3A0x62c385e6659f2aac!2sStars%20House%20Club!5e0!3m2!1sen!2sdz!4v1792144062688!5m2!1sen!2sdz";

/* ---------- opening hours ---------- */
export interface DayHours {
  /** 24h "HH:MM". Close must be later than open on the same day */
  open: string;
  close: string;
}

export const hours: (DayHours | null)[] = [
  { open: "9:00", close: "19:00" }, // Sun
  { open: "9:00", close: "19:00" }, // Mon
  { open: "9:00", close: "19:00" }, // Tue
  { open: "9:00", close: "19:00" }, // Wed
  { open: "9:00", close: "19:00" }, // Thu
  null, // Fri
  { open: "9:00", close: "19:00" }, // Sat
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

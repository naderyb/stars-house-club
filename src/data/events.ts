export interface ClubEvent {
  id: string; // used in the URL: /events#id. Keep it unique, lowercase, no spaces
  title: string;
  /** ISO date with the Algiers offset (+01:00, no daylight saving there) */
  start: string;
  /** optional. If omitted, the event is considered to last 3 hours */
  end?: string;
  category: string; // "Music", "Art", "Fashion", "Thrift", "Workshop", "Community"...
  description: string;
  /** e.g. "Free", "300 DA" */
  price?: string;
  /** poster in /public/images */
  image?: string;
  /** set to false to keep an event out of the Home/Menu banner */
  announce?: boolean;
  /** optional extra link (Instagram post, ticket form...) */
  link?: string;
}

/** Events are managed in Supabase through the admin Events page. */
export const events: ClubEvent[] = [];

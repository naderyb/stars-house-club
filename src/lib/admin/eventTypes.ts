export interface AdminEvent {
  id: string;
  title: string;
  start_at: string;
  end_at: string | null;
  category: string;
  description: string;
  price: string | null;
  image: string | null;
  link: string | null;
  announce: boolean;
}

/* Algiers is UTC+1 all year (no daylight saving), so conversions are simple. */
const HOUR = 60 * 60 * 1000;

/** timestamp from the database -> value for <input type="datetime-local"> */
export const toLocalInput = (iso: string) =>
  new Date(new Date(iso).getTime() + HOUR).toISOString().slice(0, 16);

/** value from <input type="datetime-local"> -> ISO string with the Algiers offset */
export const fromLocalInput = (value: string) => `${value}:00+01:00`;

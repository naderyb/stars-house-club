export type ArtistGroup = "exhibited" | "collaborators" | "upcoming";

export interface Artist {
  id: string;
  name: string;
  /** "Painter", "Illustrator", "Photographer", "Music collective"... */
  craft: string;
  bio?: string;
  /** photo in /public/images/artists */
  image?: string;
  /** Instagram handle, with or without the @ */
  instagram?: string;
  /** free text shown under the name: "October 2026" */
  when?: string;
  group: ArtistGroup;
  /** id of a related event in events.ts, adds a "See event" link */
  eventId?: string;
}

export const groups: { id: ArtistGroup; label: string; empty: string }[] = [
  {
    id: "exhibited",
    label: "Exhibited",
    empty: "Our first exhibitions are coming soon.",
  },
  {
    id: "collaborators",
    label: "Collaborators",
    empty: "Collaborations are on their way.",
  },
  {
    id: "upcoming",
    label: "Upcoming",
    empty: "The next artists will be announced soon.",
  },
];

/** id of this month's Artist Spotlight, or null to hide the big card */
export const spotlightId: string | null = "sample-spotlight";

/* ------------------------------------------------------------------
   SAMPLE DATA, delete these and add the real artists
------------------------------------------------------------------ */
export const artists: Artist[] = [
  {
    id: "sample-spotlight",
    name: "Artist of the Month",
    craft: "Painter",
    bio: "SAMPLE: a few lines about the artist, their story and what they'll show on the gallery walls this month.",
    instagram: "starshouseclub",
    when: "October 2026",
    group: "exhibited",
    eventId: "artist-spotlight-oct",
  },
  {
    id: "sample-1",
    name: "Sample Artist One",
    craft: "Illustrator",
    bio: "SAMPLE bio. Two lines are plenty.",
    instagram: "handle",
    when: "September 2026",
    group: "exhibited",
  },
  {
    id: "sample-2",
    name: "Sample Artist Two",
    craft: "Photographer",
    instagram: "handle",
    when: "August 2026",
    group: "exhibited",
  },
  {
    id: "sample-3",
    name: "Sample Collective",
    craft: "Music",
    bio: "SAMPLE: how they work with Stars House.",
    instagram: "handle",
    group: "collaborators",
  },
  {
    id: "sample-4",
    name: "Sample Studio",
    craft: "Design",
    instagram: "handle",
    group: "collaborators",
  },
  {
    id: "sample-5",
    name: "Sample Artist Three",
    craft: "Digital artist",
    instagram: "handle",
    when: "November 2026",
    group: "upcoming",
  },
];

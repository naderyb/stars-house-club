export const roleIds = [
  "visitor",
  "artist",
] as const;

export type RoleId = (typeof roleIds)[number];

export interface JoinRole {
  id: RoleId;
  label: string;
  tagline: string;
  /** the two big doors on the page */
  main?: boolean;
  whyLabel: string;
  whyHint: string;
  /** role specific extra question */
  detailLabel?: string;
  detailRequired?: boolean;
  /** link field */
  portfolioLabel?: string;
  portfolioRequired?: boolean;
}

export const roles: JoinRole[] = [
  {
    id: "visitor",
    label: "Visitor",
    tagline: "Just here for the vibes. No talent test.",
    main: true,
    whyLabel: "Why do you want to come to Stars House?",
    whyHint:
      "Tell us what you're looking for: the people, the music, the art, a calm place to sit... The more you tell us, the better.",
  },
  {
    id: "artist",
    label: "Artist",
    tagline: "Painter, musician, potter, designer, creator.",
    main: true,
    whyLabel: "Why do you want to come to Stars House?",
    whyHint:
      "Tell us about your art and what you'd love to do at the house: show your work, perform, meet other artists...",
    portfolioLabel: "A link to more of your work",
  },
];

export const getRole = (id: string) => roles.find((r) => r.id === id);

export const isRoleId = (value: string): value is RoleId =>
  (roleIds as readonly string[]).includes(value);

export const artTypes = [
  "Music",
  "Pottery",
  "Drawing",
  "Painting",
  "Design",
  "Photography",
  "Digital art",
  "Illustration",
  "Fashion",
  "Crafts",
  "Writing & poetry",
  "Performance",
  "Other",
];

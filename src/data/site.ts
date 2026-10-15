export const siteConfig = {
  name: "Stars House Club",
  tagline: "A cultural space for art, music & creativity.",
  slogan: "for the dreamers, creators and believers",
  city: "Algiers",
  // TODO: replace with the real links and numbers
  instagram: "https://instagram.com/",
  tiktok: "https://tiktok.com/",
  whatsapp: "https://wa.me/",
  mapsUrl: "https://maps.google.com/",
} as const;

export interface NavLink {
  label: string;
  href: string;
}

export const navLinks: NavLink[] = [
  { label: "The House", href: "/the-house" },
  { label: "Menu", href: "/menu" },
  { label: "Events", href: "/events" },
  { label: "Workshops", href: "/workshops" },
  // { label: "Artists", href: "/artists" },
  { label: "Join", href: "/join" },
  { label: "Visit Us", href: "/visit" },
];

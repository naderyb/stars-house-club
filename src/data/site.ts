export const siteConfig = {
  name: "Stars House Club",
  tagline: "A cultural space for art, music & creativity.",
  slogan: "for the dreamers, creators and believers",
  city: "Algiers",
  instagram: "https://instagram.com/starshouseclub",
  tiktok:
    "https://www.tiktok.com/@stars.house.club?is_from_webapp=1&sender_device=pc",
  whatsapp: `https://wa.me/${process.env.WHATSAPP_PHONE}`,
  mapsUrl: "https://maps.app.goo.gl/SfytPhe8b5jAUMVF6",
  developer: "YOUB Nader aka HCHICHA",
  developerInstagram: "https://instagram.com/notnadertho",
  url: "https://starshouseclub.vercel.app",
  /** true = join is switched off and people see the "back soon" popup */
  joinPaused: false,
} as const;

export interface NavLink {
  label: string;
  href: string;
}

export const navLinks: NavLink[] = [
  { label: "Main", href: "/" },
  { label: "The House", href: "/the-house" },
  { label: "Menu", href: "/menu" },
  { label: "Events", href: "/events" },
  { label: "Workshops", href: "/workshops" },
  // { label: "Artists", href: "/artists" },
  { label: "Join", href: "/join" },
  { label: "Visit Us", href: "/visit" },
];


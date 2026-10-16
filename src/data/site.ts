export const siteConfig = {
  name: "Stars House Club",
  tagline: "A cultural space for art, music & creativity.",
  slogan: "for the dreamers, creators and believers",
  city: "Algiers",
  instagram: "https://instagram.com/starshouseclub",
  // tiktok: "https://tiktok.com/",
  whatsapp: `https://wa.me/${process.env.WHATSAPP_PHONE}`,
  mapsUrl: "https://maps.app.goo.gl/SfytPhe8b5jAUMVF6",
  developer: "YOUB Nader aka HCHICHA",
  developper_social_media: "https://instagram.com/notnadertho",
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

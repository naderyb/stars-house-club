export interface WorkshopOption {
  id: string;
  name: string;
  price: number;
  note?: string;
  /** add-ons can only be picked once a base option of the same workshop is selected */
  addOn?: boolean;
}

export interface Workshop {
  id: string;
  title: string;
  /** Arabic label, as on the flyer */
  ar?: string;
  blurb: string;
  /** e.g. "Materials included". Fill it in when confirmed */
  materials?: string;
  options: WorkshopOption[];
}

export const workshopsNote =
  "We keep our prices friendly because art and creativity should always have a place here <3";

export const workshops: Workshop[] = [
  {
    id: "bracelets",
    title: "Friendship Bracelet",
    blurb: "Pick your colors, tie your knots, leave with something to share.",
    options: [
      { id: "bracelet-100", name: "Two bracelets", price: 100 },
      { id: "bracelet-150", name: "Two bracelets", price: 150 },
    ],
  },
  {
    id: "painting",
    title: "Painting",
    ar: "الرسم",
    blurb:
      "Choose your surface and make it yours: paper, concrete, a tote bag or a canvas.",
    options: [
      { id: "paint-paper", name: "Yellow paper", price: 300 },
      { id: "paint-concrete", name: "Concrete", price: 700 },
      { id: "paint-tote", name: "Tote bag", price: 1000 },
      { id: "paint-canvas", name: "Canvas", price: 1500 },
    ],
  },
  {
    id: "clay",
    title: "Clay",
    ar: "صلصال",
    blurb:
      "Shape it with your hands, let it dry, take it home. Add painting to finish it off.",
    options: [
      { id: "clay-250", name: "Air dry clay", note: "250g", price: 800 },
      { id: "clay-500", name: "Air dry clay", note: "500g", price: 1150 },
      { id: "clay-paint", name: "Add painting", price: 200, addOn: true },
    ],
  },
];

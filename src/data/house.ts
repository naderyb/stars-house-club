export interface Room {
  id: string;
  /** number printed on the plan */
  number: number;
  name: string;
  text: string;
  /** directions, so people can find it */
  find: string;
  tags: string[];
  /** tap zone, polygon points in % of the plan image [x, y] */
  zone: [number, number][];
  /** position of the number pin, in % of the plan image */
  pin: { x: number; y: number };
}

export interface Floor {
  id: string;
  label: string;
  image: string;
  /** real pixel size of the image file: set these to your exported crop */
  width: number;
  height: number;
  rooms: Room[];
}

export const houseStory = {
  lead: "Stars House Club was created with one simple belief: everyone deserves a place where they can create, belong, and express themselves freely.",
  paragraphs: [
    "More than a club, café, or art space, Stars House is a third place. A space that exists beyond home and school or work. A place where we choose to be.",
    "At Stars House, artists, musicians, creators, and dreamers come together in an environment built on creativity, respect, and community. Whether you're learning an instrument, drawing your first sketch, performing on stage, joining a workshop, or simply spending time with people who share your interests, you're welcome here.",
    "Every corner of Stars House is designed to inspire. From creative workshops and music rooms to artist spotlight exhibitions, fashion shows, festivals, pop-up thrifting events, live performances, and community gatherings. Here, every voice matters, every story has value, and every artist has the opportunity to shine.",
    "We believe creativity should never be limited by fear of judgment. Stars House encourages self expression, collaboration, and curiosity. It is a place where ideas are shared, friendships are formed, and talent is nurtured.",
  ],
  closing:
    "Stars House Club isn't just a destination, it's a community, a creative home, and a place where you can truly be yourself.",
};

export const floors: Floor[] = [
  {
    id: "ground",
    label: "Ground floor",
    image: "/images/plan-ground.webp",
    width: 1944, // TODO: your real image size
    height: 980,
    rooms: [
      {
        id: "gallery",
        number: 1,
        name: "The Gallery",
        text: "Where the walls belong to the artists. Exhibitions and the monthly Artist Spotlight live here.",
        find: "You're already here. The entrance door opens straight into the gallery.",
        tags: ["Exhibitions", "Artist Spotlight"],
        zone: [
          [1.5, 8],
          [24.5, 8],
          [24.5, 95],
          [1.5, 95],
        ],
        pin: { x: 14, y: 39 },
      },
      {
        id: "living-room",
        number: 2,
        name: "Living Room",
        text: "Sofas, cushions and slow afternoons. Grab a seat, meet people, stay as long as you like.",
        find: "Straight ahead from the gallery, past the wall: blue sofas and round tables.",
        tags: ["Chill area", "Hang out"],
        zone: [
          [25, 8],
          [51, 8],
          [51, 55],
          [25, 55],
        ],
        pin: { x: 36.6, y: 40 },
      },
      {
        id: "kitchen",
        number: 3,
        name: "Kitchen",
        text: "Coffee, tea and homemade desserts come out of here.",
        find: "Bottom middle, right below the living room. The wooden stairs next to it go up.",
        tags: ["Coffee", "Tea", "Homemade desserts"],
        zone: [
          [25, 56],
          [55, 56],
          [55, 95],
          [25, 95],
        ],
        pin: { x: 43, y: 73.5 },
      },
      {
        id: "dancing-space",
        number: 4,
        name: "Dancing Space",
        text: "An open floor for gatherings, festivals and fashion shows. Clear the chairs and make room.",
        find: "Right of the living room, with the round tables and stools.",
        tags: ["Fashion shows", "Festivals", "Gatherings"],
        zone: [
          [56, 8],
          [89, 8],
          [89, 42],
          [80, 42],
          [80, 69],
          [56, 69],
        ],
        pin: { x: 67.9, y: 45.3 },
      },
      {
        id: "stage",
        number: 5,
        name: "The Stage",
        text: "Live performances and music. Whether you're on it or in front of it, every voice matters.",
        find: "Bottom right, the wavy platform just past the kitchen.",
        tags: ["Live performances", "Music"],
        zone: [
          [56, 70],
          [80, 70],
          [80, 95],
          [56, 95],
        ],
        pin: { x: 67.9, y: 75.1 },
      },
      {
        id: "thinking-room",
        number: 6,
        name: "Thinking Room",
        text: "Where the king goes alone.",
        find: "Top right corner, behind the dancing space.",
        tags: ["Quiet corner"],
        zone: [
          [90, 8],
          [99, 8],
          [99, 41],
          [90, 41],
        ],
        pin: { x: 94.2, y: 27.3 },
      },
      {
        id: "workshop-area",
        number: 7,
        name: "Workshop Area",
        text: "Painting, clay, friendship bracelets. Come make something with your hands.",
        find: "Bottom right corner, behind the stage.",
        tags: ["Painting", "Clay", "Bracelets"],
        zone: [
          [81, 43],
          [99, 43],
          [99, 95],
          [81, 95],
        ],
        pin: { x: 90.5, y: 73.5 },
      },
    ],
  },
  {
    id: "first",
    label: "First floor",
    image: "/images/plan-first.webp",
    width: 1560, // TODO: your real image size
    height: 744,
    rooms: [
      {
        id: "gallery-first",
        number: 1,
        name: "The Gallery",
        text: "The gallery continues upstairs, with more wall space for art.",
        find: "Left side of the floor, through its own door.",
        tags: ["Exhibitions"],
        zone: [
          [1.5, 5],
          [24.5, 5],
          [24.5, 95],
          [1.5, 95],
        ],
        pin: { x: 14.1, y: 37.4 },
      },
      {
        id: "multipurpose",
        number: 8,
        name: "Multipurpose Space",
        text: "A big flexible room for workshops and events. It changes shape depending on what's happening.",
        find: "The huge open space in the middle and to the right. You can't miss it.",
        tags: ["Workshops", "Events"],
        zone: [
          [25, 5],
          [99, 5],
          [99, 67],
          [81, 67],
          [81, 95],
          [25, 95],
        ],
        pin: { x: 65.5, y: 33.1 },
      },
      {
        id: "private-area",
        number: 9,
        name: "Private Area",
        text: "IT'S PRIVATE FOR A REASON :)",
        find: "No need to find it, IT'S PRIVATE!",
        tags: ["Private"],
        zone: [
          [81.5, 68],
          [99, 68],
          [99, 95],
          [81.5, 95],
        ],
        pin: { x: 89.7, y: 75 },
      },
    ],
  },
];

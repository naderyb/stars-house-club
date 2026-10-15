export interface ExploreCard {
    title: string;
    text: string;
    href: string;
  }
  
  export const exploreCards: ExploreCard[] = [
    {
      title: "Events",
      text: "Live performances, fashion shows, pop-up thrifting and more.",
      href: "/events",
    },
    {
      title: "Workshops",
      text: "Painting, clay, friendship bracelets. Come make something.",
      href: "/workshops",
    },
    // {
    //   title: "Artist Spotlight",
    //   text: "A new artist takes center stage every month. Free to attend.",
    //   href: "/artists",
    // },
    {
      title: "The Menu",
      text: "Coffee, tea and homemade desserts at friendly prices.",
      href: "/menu",
    },
  ];

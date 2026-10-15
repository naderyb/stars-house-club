/** Accepts "handle" or "@handle" and returns the profile link */
export const instagramUrl = (handle: string) =>
  `https://instagram.com/${handle.replace(/^@/, "")}`;

export const instagramLabel = (handle: string) =>
  `@${handle.replace(/^@/, "")}`;

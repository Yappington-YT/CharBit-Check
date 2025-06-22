// Predefined tags for CharBit platform
export const PREDEFINED_TAGS = [
  // Character types
  "OC", // Original Character - not mandatory but available
  "Anime",
  "Furry",
  "Human",
  "Fantasy",
  "Sci-Fi",
  "Horror",
  "Romance",
  "Adventure",
  "Mystery",
  
  // Character traits
  "Cute",
  "Dark",
  "Mysterious",
  "Funny",
  "Serious",
  "Friendly",
  "Villain",
  "Hero",
  "Anti-Hero",
  "Magical"
];

export function isValidTag(tag: string): boolean {
  return PREDEFINED_TAGS.includes(tag);
}

export function getAvailableTags(): string[] {
  return [...PREDEFINED_TAGS];
}
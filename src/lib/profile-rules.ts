import { z } from "zod";

export const interestFields = [
  { key: "hobbies", label: "Hobbies", placeholder: "Football, reading, dancing…" },
  { key: "best_colour", label: "Best Colour", placeholder: "Your favourite colour" },
  { key: "favourite_dish", label: "Favourite Dish", placeholder: "A meal you love" },
  { key: "cartoon", label: "Favourite Cartoon", placeholder: "Your favourite cartoon" },
  { key: "celebrity", label: "Favourite Celebrity", placeholder: "Someone you admire" },
  { key: "best_friend", label: "Best Friend", placeholder: "Your friend's first name or nickname" },
  { key: "other_interests", label: "Other Interests", placeholder: "Music, sports, dreams and more…" },
] as const;
const short = z.string().trim().max(300).default("");
export const interestsSchema = z.object({ hobbies: short, best_colour: short, favourite_dish: short, cartoon: short, celebrity: short, best_friend: short, other_interests: z.string().trim().max(1000).default("") }).strict();
export type Interests = z.infer<typeof interestsSchema>;
export const emptyInterests: Interests = interestsSchema.parse({});
export function requireAdminRole(role: string | undefined) {
  if (role !== "admin") throw new Error("Only school administrators can change school details.");
}
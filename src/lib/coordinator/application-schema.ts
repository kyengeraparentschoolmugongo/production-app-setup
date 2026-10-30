import { z } from "zod";
import { CLASSES, STREAMS, PUPILS, POSITIONS, youtubeId } from "./rules";

export const applicationSchema = z.object({
  student_name: z.string().trim().refine(v => PUPILS.includes(v), "Choose a pupil from the list."),
  class_name: z.string().refine(v => CLASSES.includes(v)),
  stream_name: z.string().refine(v => STREAMS.includes(v)),
  age: z.number().int().min(6).max(15).nullable().optional(),
  position: z.string().refine(v => POSITIONS.some(p => p.value === v)),
  experience: z.string().max(5000).nullable().optional(),
  manifesto: z.string().max(10000).default(""),
  photo_url: z.string().max(500000).nullable().optional(),
  manifesto_photos: z.array(z.string().max(500000)).max(6).default([]),
  youtube_url: z.string().nullable().optional().refine(v => !v || !!youtubeId(v)),
});
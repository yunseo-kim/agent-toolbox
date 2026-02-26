import { z } from "zod";

export const PresetEntry = z.object({
  name: z.string(),
  description: z.string(),
  items: z.array(z.string()),
});

export const PresetsSchema = z.object({
  presets: z.array(PresetEntry),
});

export type Preset = z.infer<typeof PresetEntry>;
export type PresetsConfig = z.infer<typeof PresetsSchema>;

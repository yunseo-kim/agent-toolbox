import { parse as parseYaml } from "yaml";
import { PresetsSchema, type PresetsConfig } from "../schemas/presets.js";

export async function loadPresets(presetsPath: string): Promise<PresetsConfig> {
  const content = await Bun.file(presetsPath).text();
  const raw = parseYaml(content);
  return PresetsSchema.parse(raw);
}

export function resolvePreset(config: PresetsConfig, presetName: string): string[] | null {
  const preset = config.presets.find((entry) => entry.name === presetName);
  return preset ? preset.items : null;
}

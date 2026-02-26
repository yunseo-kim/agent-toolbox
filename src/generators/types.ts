import type { ParsedSkill } from "../schemas/catalog.js";
import type { TargetTool } from "../schemas/common.js";

export interface GeneratorOptions {
  /** Parsed catalog skills to include */
  skills: ParsedSkill[];
  /** Output directory (e.g., dist/targets/claude-code/) */
  outputDir: string;
  /** Source catalog directory (for copying full skill directories) */
  catalogDir: string;
  /** Plugin version */
  version: string;
}

export interface GeneratorResult {
  /** Target tool this generator produced for */
  target: TargetTool;
  /** Number of skills emitted */
  skillCount: number;
  /** Output directory used */
  outputDir: string;
  /** List of files/directories created */
  artifacts: string[];
  /** Any warnings during generation */
  warnings: string[];
}

export interface TargetGenerator {
  readonly target: TargetTool;
  generate(options: GeneratorOptions): Promise<GeneratorResult>;
}

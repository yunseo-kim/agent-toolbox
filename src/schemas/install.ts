import { z } from "zod";
import { TargetTool } from "./common.js";

export const InstallFilters = z.object({
  target: TargetTool,
  domain: z.string().optional(),
  subdomain: z.string().optional(),
  framework: z.string().optional(),
  tag: z.string().optional(),
  preset: z.string().optional(),
  skill: z.array(z.string()).optional(),
  interactive: z.boolean().default(false),
  dryRun: z.boolean().default(false),
  refresh: z.boolean().optional().default(false),
  offline: z.boolean().optional().default(false),
});

export type InstallFilters = z.infer<typeof InstallFilters>;
export type InstallFiltersInput = z.input<typeof InstallFilters>;

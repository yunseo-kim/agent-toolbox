import { z } from "zod";

export const SubdomainList = z.array(z.string());

export const DomainEntry = z.object({
  description: z.string(),
  subdomains: SubdomainList,
});

export const TaxonomySchema = z.object({
  domains: z.record(z.string(), DomainEntry),
});

export type Taxonomy = z.infer<typeof TaxonomySchema>;

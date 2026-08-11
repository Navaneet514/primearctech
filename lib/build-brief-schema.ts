import { z } from "zod";

const optionalTrimmed = (max: number) =>
  z.string().trim().max(max).optional().transform((value) => value || undefined);

export const buildBriefSchema = z.object({
  name: optionalTrimmed(80),
  email: z.string().trim().email().max(160),
  website: z.string().trim().min(4).max(240),
  problem: z.string().trim().min(20).max(1200),
  consent: z.literal(true),
  companyFax: optionalTrimmed(120),
  startedAt: z.number().int().positive(),
  source: optionalTrimmed(80),
  utmSource: optionalTrimmed(200),
  utmMedium: optionalTrimmed(200),
  utmCampaign: optionalTrimmed(200),
  utmContent: optionalTrimmed(200),
  utmTerm: optionalTrimmed(200),
  gclid: optionalTrimmed(240),
  fbclid: optionalTrimmed(240),
  ttclid: optionalTrimmed(240),
  msclkid: optionalTrimmed(240),
}).strict();

export type BuildBriefSubmission = z.infer<typeof buildBriefSchema>;

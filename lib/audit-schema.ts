import { z } from "zod";

const optionalTrimmed = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((value) => value || undefined);

export const auditSubmissionSchema = z
  .object({
    name: z.string().trim().min(2).max(80),
    email: z.string().trim().email().max(160),
    company: z.string().trim().min(2).max(120),
    website: optionalTrimmed(240),
    monthlyCalls: z.enum(["under-50", "50-149", "150-299", "300-plus"]),
    currentSystem: optionalTrimmed(120),
    challenge: z.enum([
      "missed-calls",
      "after-hours",
      "slow-follow-up",
      "unsure",
    ]),
    consent: z.literal(true),
    companyFax: optionalTrimmed(120),
    startedAt: z.number().int().positive(),
    utmSource: optionalTrimmed(120),
    utmMedium: optionalTrimmed(120),
    utmCampaign: optionalTrimmed(160),
  })
  .strict();

export type AuditSubmission = z.infer<typeof auditSubmissionSchema>;

export function normalizeWebsite(value?: string): string | undefined {
  if (!value) return undefined;
  const candidate = /^https?:\/\//i.test(value) ? value : `https://${value}`;
  const url = new URL(candidate);
  if (!url.hostname.includes(".")) {
    throw new Error("Website must include a valid domain");
  }
  return url.toString();
}

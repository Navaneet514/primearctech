import { describe, expect, it } from "vitest";
import { auditSubmissionSchema, normalizeWebsite } from "@/lib/audit-schema";
import { calculateRevenueOpportunity } from "@/lib/calculator";

describe("revenue calculator", () => {
  it("calculates missed calls, bookings, and revenue", () => {
    const result = calculateRevenueOpportunity({
      monthlyCalls: 300,
      answerRate: 52,
      leadRate: 70,
      recoveryRate: 50,
      averageTicket: 425,
    });

    expect(result.missedCalls).toBeCloseTo(144);
    expect(result.recoveredBookings).toBeCloseTo(50.4);
    expect(result.monthlyRevenue).toBeCloseTo(21420);
  });

  it("clamps percentage inputs and prevents negative values", () => {
    const result = calculateRevenueOpportunity({
      monthlyCalls: -10,
      answerRate: 200,
      leadRate: -20,
      recoveryRate: 300,
      averageTicket: -100,
    });

    expect(result).toEqual({
      missedCalls: 0,
      estimatedLeads: 0,
      recoveredBookings: 0,
      monthlyRevenue: 0,
    });
  });
});

describe("audit submission", () => {
  const valid = {
    name: "Jordan Lee",
    email: "jordan@example.com",
    company: "Reliable Air",
    monthlyCalls: "150-299",
    challenge: "missed-calls",
    consent: true,
    startedAt: Date.now() - 5000,
  } as const;

  it("normalizes bare domains to secure URLs", () => {
    expect(normalizeWebsite("reliableair.com")).toBe("https://reliableair.com/");
    expect(normalizeWebsite("http://reliableair.com/path")).toBe("http://reliableair.com/path");
  });

  it("rejects malformed URLs", () => {
    expect(() => normalizeWebsite("localhost")).toThrow();
  });

  it("accepts the declared form shape and rejects unknown fields", () => {
    expect(auditSubmissionSchema.safeParse(valid).success).toBe(true);
    expect(auditSubmissionSchema.safeParse({ ...valid, surprise: true }).success).toBe(false);
  });
});

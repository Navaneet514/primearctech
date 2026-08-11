import { describe, expect, it } from "vitest";
import { decideCallRoute, validateDemoServiceArea } from "@/lib/demo/policy";
import { createDemoSessionSchema } from "@/lib/demo/schema";

describe("FieldRelay call policy", () => {
  it("routes danger before every other decision", () => {
    expect(decideCallRoute({
      zip: "78704",
      immediateDanger: true,
      emergencyLanguage: false,
      requestedEstimate: false,
      bookingRequested: true,
    })).toBe("escalate");
  });

  it("books only supported, non-emergency requests", () => {
    expect(decideCallRoute({
      zip: "78704",
      immediateDanger: false,
      emergencyLanguage: false,
      requestedEstimate: false,
      bookingRequested: true,
    })).toBe("book");
  });

  it("captures unsupported ZIPs and price requests without promising service", () => {
    expect(decideCallRoute({
      zip: "78666",
      immediateDanger: false,
      emergencyLanguage: false,
      requestedEstimate: true,
      bookingRequested: true,
    })).toBe("capture");
  });

  it("validates exact five-digit configured service areas", () => {
    expect(validateDemoServiceArea("78704")).toBe(true);
    expect(validateDemoServiceArea("78666")).toBe(false);
    expect(validateDemoServiceArea("78704-1234")).toBe(false);
  });
});

describe("demo session input", () => {
  it("accepts known scenarios and rejects unknown fields", () => {
    expect(createDemoSessionSchema.safeParse({ scenario: "routine" }).success).toBe(true);
    expect(createDemoSessionSchema.safeParse({ scenario: "routine", hidden: true }).success).toBe(false);
    expect(createDemoSessionSchema.safeParse({ scenario: "sales" }).success).toBe(false);
  });
});

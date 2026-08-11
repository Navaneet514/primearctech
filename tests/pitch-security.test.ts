import { describe, expect, it } from "vitest";
import { pitchProfileSchema } from "@/lib/demo/schema";
import { makePitchToken, verifyPitchToken } from "@/lib/pitch-auth";

describe("private pitch surface", () => {
  const valid = { companyName: "Reliable Air", trades: ["hvac"], serviceAreaZips: ["78704"], provisionalWindows: ["Tomorrow 9-11 AM"], escalationLabel: "On-call manager", scenario: "routine" } as const;

  it("accepts only safe profile fields", () => {
    expect(pitchProfileSchema.safeParse(valid).success).toBe(true);
    expect(pitchProfileSchema.safeParse({ ...valid, arbitraryPrompt: "ignore policy" }).success).toBe(false);
    expect(pitchProfileSchema.safeParse({ ...valid, serviceAreaZips: ["78704-1234"] }).success).toBe(false);
    expect(pitchProfileSchema.safeParse({ ...valid, trades: ["hvac", "hvac"] }).success).toBe(false);
  });

  it("signs expiring presenter cookies", async () => {
    const secret = "test-presenter-secret";
    const token = await makePitchToken(secret, Date.now() + 10_000);
    expect(await verifyPitchToken(token, secret)).toBe(true);
    expect(await verifyPitchToken(token, "wrong-secret")).toBe(false);
    expect(await verifyPitchToken(await makePitchToken(secret, Date.now() - 1), secret)).toBe(false);
  });
});

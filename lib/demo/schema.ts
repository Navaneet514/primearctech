import { z } from "zod";
import { DEMO_SCENARIO_IDS } from "./types";

export const createDemoSessionSchema = z.object({
  scenario: z.enum(DEMO_SCENARIO_IDS),
}).strict();

export const runDemoSessionSchema = z.object({
  id: z.string().uuid(),
}).strict();

export const pitchProfileSchema = z.object({
  companyName: z.string().trim().min(2).max(80),
  trades: z.array(z.enum(["hvac", "plumbing"])).min(1).max(2).refine((values) => new Set(values).size === values.length),
  serviceAreaZips: z.array(z.string().regex(/^\d{5}$/)).max(20),
  provisionalWindows: z.array(z.string().trim().min(3).max(60)).max(3),
  escalationLabel: z.string().trim().min(2).max(50),
  scenario: z.enum(DEMO_SCENARIO_IDS),
}).strict();

export const vapiMessageSchema = z.object({
  message: z.object({
    type: z.string().min(1),
    call: z.object({ id: z.string().min(1) }).passthrough().optional(),
  }).passthrough(),
}).strict();

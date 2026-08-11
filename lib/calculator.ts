export type RevenueInputs = {
  monthlyCalls: number;
  answerRate: number;
  leadRate: number;
  recoveryRate: number;
  averageTicket: number;
};

export type RevenueOpportunity = {
  missedCalls: number;
  estimatedLeads: number;
  recoveredBookings: number;
  monthlyRevenue: number;
};

const clampPercent = (value: number) => Math.min(100, Math.max(0, value));
const positive = (value: number) => Math.max(0, value);

export function calculateRevenueOpportunity(
  inputs: RevenueInputs,
): RevenueOpportunity {
  const monthlyCalls = positive(inputs.monthlyCalls);
  const answerRate = clampPercent(inputs.answerRate) / 100;
  const leadRate = clampPercent(inputs.leadRate) / 100;
  const recoveryRate = clampPercent(inputs.recoveryRate) / 100;
  const averageTicket = positive(inputs.averageTicket);

  const missedCalls = monthlyCalls * (1 - answerRate);
  const estimatedLeads = missedCalls * leadRate;
  const recoveredBookings = estimatedLeads * recoveryRate;

  return {
    missedCalls,
    estimatedLeads,
    recoveredBookings,
    monthlyRevenue: recoveredBookings * averageTicket,
  };
}

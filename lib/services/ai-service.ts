import { mockAIProvider } from "@/lib/providers";
import type { Lead } from "@/lib/providers";

export async function scoreLead(lead: Lead) {
  return mockAIProvider.scoreLead(lead);
}

export async function personalizeLead(lead: Lead, product: string) {
  return mockAIProvider.personalize({ lead, product });
}

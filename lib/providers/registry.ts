import type { ProviderHealth } from "./types";
import { isProviderConfigured } from "./config";

const PROVIDERS: ProviderHealth[] = [
  { id: "companies-mock", name: "Local company data", capability: "companies", status: "mock", configured: true },
  { id: "people-mock", name: "Local people data", capability: "people", status: "mock", configured: true },
  { id: "ai-mock", name: "Local AI provider", capability: "ai", status: "mock", configured: true },
  { id: "email-mock", name: "Review-only email", capability: "email", status: "mock", configured: true },
  { id: "calendar-mock", name: "Local calendar", capability: "calendar", status: "mock", configured: true },
  { id: "enrichment-mock", name: "Local enrichment", capability: "enrichment", status: "mock", configured: true },
];

/**
 * The app stays fully usable without third-party keys. When a real provider
 * key is added later, this endpoint exposes that capability as configured
 * without changing any page or workflow contracts.
 */
export function getProviderHealth(): ProviderHealth[] {
  return PROVIDERS.map((provider) => {
    const configured = isProviderConfigured(provider.capability);
    return configured
      ? { ...provider, status: "configured", configured: true }
      : provider;
  });
}

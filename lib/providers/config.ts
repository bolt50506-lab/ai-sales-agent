export type ProviderEnvKey =
  | "COMPANY_PROVIDER_API_KEY"
  | "PEOPLE_PROVIDER_API_KEY"
  | "AI_PROVIDER_API_KEY"
  | "EMAIL_PROVIDER_API_KEY"
  | "CALENDAR_PROVIDER_API_KEY"
  | "ENRICHMENT_PROVIDER_API_KEY";

export const PROVIDER_ENV_KEYS: Record<string, ProviderEnvKey> = {
  companies: "COMPANY_PROVIDER_API_KEY",
  people: "PEOPLE_PROVIDER_API_KEY",
  ai: "AI_PROVIDER_API_KEY",
  email: "EMAIL_PROVIDER_API_KEY",
  calendar: "CALENDAR_PROVIDER_API_KEY",
  enrichment: "ENRICHMENT_PROVIDER_API_KEY",
};

export function isProviderConfigured(capability: string) {
  const key = PROVIDER_ENV_KEYS[capability];
  return Boolean(key && process.env[key]);
}

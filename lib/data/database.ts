export const SALES_AGENT_TABLES = {
  workspaces: "workspaces",
  icps: "icps",
  campaigns: "campaigns",
  opportunities: "opportunities",
  conversations: "conversations",
  workflows: "workflows",
  analyticsEvents: "analytics_events",
} as const;

export type SalesAgentTable = (typeof SALES_AGENT_TABLES)[keyof typeof SALES_AGENT_TABLES];

/**
 * Persistence remains behind this boundary. Local mode is the default;
 * Supabase adapters can use the same domain types without changing pages.
 */
export function isSupabaseConfigured() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY);
}

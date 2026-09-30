import type { ProviderHealth } from "./types";

export function getProviderHealth(): ProviderHealth[] {
  return [
    { id:"companies-mock", name:"Local company data", capability:"companies", status:"mock", configured:true },
    { id:"people-mock", name:"Local people data", capability:"people", status:"mock", configured:true },
    { id:"ai-mock", name:"Local AI provider", capability:"ai", status:"mock", configured:true },
    { id:"email-mock", name:"Review-only email", capability:"email", status:"mock", configured:true },
    { id:"calendar-mock", name:"Local calendar", capability:"calendar", status:"mock", configured:true },
    { id:"enrichment-mock", name:"Local enrichment", capability:"enrichment", status:"mock", configured:true },
  ];
}

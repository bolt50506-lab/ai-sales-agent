import { NextResponse } from "next/server";
import { searchCompanies } from "@/lib/services";
import { recordEvent } from "@/lib/services/event-service";
import { getProviderHealth } from "@/lib/providers/registry";

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const q = params.get("q") ?? "";
  const industry = params.get("industry") ?? "";
  const companies = await searchCompanies(q, { industry });
  recordEvent("company_search", "search", { query: q, industry, results: companies.length });

  const provider = getProviderHealth().find((item) => item.capability === "companies");
  return NextResponse.json({
    companies,
    provider: provider?.id ?? "companies-mock",
    providerStatus: provider?.status ?? "mock",
  });
}

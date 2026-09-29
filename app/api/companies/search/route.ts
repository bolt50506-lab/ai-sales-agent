import { NextResponse } from "next/server";
import { searchCompanies } from "@/lib/services";
import { recordEvent } from "@/lib/services/event-service";

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const q = params.get("q") ?? "";
  const industry = params.get("industry") ?? "";
  const companies = await searchCompanies(q, { industry });
  recordEvent("company_search","search",{query:q,industry,results:companies.length});return NextResponse.json({ companies, provider: "mock" });
}
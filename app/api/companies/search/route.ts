import { NextResponse } from "next/server";
import { searchCompanies } from "@/lib/services";

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const q = params.get("q") ?? "";
  const industry = params.get("industry") ?? "";
  const companies = await searchCompanies(q, { industry });
  return NextResponse.json({ companies, provider: "mock" });
}
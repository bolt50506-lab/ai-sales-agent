import { NextResponse } from "next/server";
import { getProviderHealth } from "@/lib/providers/registry";
import { isSupabaseConfigured } from "@/lib/data/database";

export async function GET() {
  return NextResponse.json({
    persistence: isSupabaseConfigured() ? "supabase-ready" : "local",
    providers: getProviderHealth(),
  });
}

import { NextResponse } from "next/server";
import { searchCompanies } from "@/lib/services";
import { recordEvent } from "@/lib/services/event-service";
import { getProviderHealth } from "@/lib/providers/registry";
import { getWorkspaceContext } from "@/lib/services/store-service";

export async function GET(request: Request) {
  const params=new URL(request.url).searchParams;const q=params.get("q")??"";const industry=params.get("industry")??"";
  const companies=await searchCompanies(q,{industry});recordEvent("company_search","search",{query:q,industry,results:companies.length});
  const ctx=await getWorkspaceContext();
  if(ctx&&companies.length){await ctx.supabase.from("companies").upsert(companies.map(c=>({id:crypto.randomUUID(),workspace_id:ctx.workspaceId,source:c.source||"mock",name:c.name,domain:c.domain,industry:c.industry,employee_count:c.employees,location:c.location,description:c.description})),{onConflict:"workspace_id,source,external_id"}).catch(()=>{});}
  const provider=getProviderHealth().find(item=>item.capability==="companies");
  return NextResponse.json({companies,provider:provider?.id??"companies-mock",providerStatus:provider?.status??"mock"});
}
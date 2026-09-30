import { NextResponse } from "next/server";
import { scoreLead } from "@/lib/services";
import { recordEvent } from "@/lib/services/event-service";
import { getWorkspaceContext } from "@/lib/services/store-service";
export async function POST(request:Request){
 try{const lead=await request.json();if(!lead?.id)return NextResponse.json({error:"lead is required"},{status:400});const result=await scoreLead(lead);const ctx=await getWorkspaceContext();if(ctx&&/^[0-9a-f-]{36}$/i.test(String(lead.id)))await ctx.supabase.from("leads").update({score:result.score,score_reason:{reasons:result.reasons},updated_at:new Date().toISOString()}).eq("id",lead.id).eq("workspace_id",ctx.workspaceId);recordEvent("lead_scored",String(lead.id),{score:result.score});return NextResponse.json(result);}
 catch{return NextResponse.json({error:"Unable to score lead"},{status:400});}
}
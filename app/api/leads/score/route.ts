import { NextResponse } from "next/server";
import { scoreLead } from "@/lib/services";
import { recordEvent } from "@/lib/services/event-service";
export async function POST(request:Request){
 try{const lead=await request.json();if(!lead?.id)return NextResponse.json({error:"lead is required"},{status:400});const result=await scoreLead(lead);recordEvent("lead_scored",String(lead.id),{score:result.score});return NextResponse.json(result);}
 catch{return NextResponse.json({error:"Unable to score lead"},{status:400});}
}
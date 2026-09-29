import { NextResponse } from "next/server";
import { personalizeLead } from "@/lib/services";
import { recordEvent } from "@/lib/services/event-service";
export async function POST(request:Request){
 try{const body=await request.json();if(!body?.lead)return NextResponse.json({error:"lead is required"},{status:400});const result=await personalizeLead(body.lead,body.product??"our solution");recordEvent("lead_personalized",String(body.lead.id),{});return NextResponse.json(result);}
 catch{return NextResponse.json({error:"Unable to personalize lead"},{status:400});}
}
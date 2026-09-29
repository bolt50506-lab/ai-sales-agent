import { NextResponse } from "next/server";
import { personalizeLead } from "@/lib/services";
export async function POST(request:Request){
 try{const body=await request.json();if(!body?.lead)return NextResponse.json({error:"lead is required"},{status:400});return NextResponse.json(await personalizeLead(body.lead,body.product??"our solution"));}
 catch{return NextResponse.json({error:"Unable to personalize lead"},{status:400});}
}
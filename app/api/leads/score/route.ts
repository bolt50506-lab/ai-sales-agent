import { NextResponse } from "next/server";
import { scoreLead } from "@/lib/services";
export async function POST(request:Request){
 try{const lead=await request.json();if(!lead?.id)return NextResponse.json({error:"lead is required"},{status:400});return NextResponse.json(await scoreLead(lead));}
 catch{return NextResponse.json({error:"Unable to score lead"},{status:400});}
}
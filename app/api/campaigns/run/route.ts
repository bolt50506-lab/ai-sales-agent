import { NextResponse } from "next/server";
import { mockEmailProvider } from "@/lib/providers";
export async function POST(request:Request){
 try{const body=await request.json();const emails=Array.isArray(body?.emails)?body.emails:[];if(!emails.length)return NextResponse.json({queued:0,mode:"local"});const results=await Promise.all(emails.filter((x:any)=>x?.to).map((x:any)=>mockEmailProvider.send({to:x.to,subject:x.subject??"Sales outreach",body:x.body??""})));return NextResponse.json({queued:results.length,results,mode:"review-only-mock"});}
 catch{return NextResponse.json({error:"Campaign run failed"},{status:500});}
}
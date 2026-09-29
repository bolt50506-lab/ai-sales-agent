import { NextResponse } from "next/server";
import { searchCompanies } from "@/lib/services";
export async function GET(request:Request){
 const q=new URL(request.url).searchParams.get("q")??"";
 const companies=await searchCompanies(q);
 return NextResponse.json({companies,provider:"mock"});
}
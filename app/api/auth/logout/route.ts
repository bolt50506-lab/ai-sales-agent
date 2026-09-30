import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
export async function GET(request:Request){const supabase=await createClient();if(supabase)await supabase.auth.signOut();return NextResponse.redirect(new URL("/login",request.url));}
export async function POST(request:Request){const supabase=await createClient();if(supabase)await supabase.auth.signOut();return NextResponse.json({ok:true});}

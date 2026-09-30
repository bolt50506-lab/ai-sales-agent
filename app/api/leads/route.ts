import { NextResponse } from "next/server";
import { getWorkspaceContext } from "@/lib/services/store-service";

const seed=[
 {name:"Sarah Khan",title:"Founder & CEO",company:"Northstar Software",email:"sarah@northstar.example",score:92,status:"qualified"},
 {name:"Omar Ahmed",title:"Managing Director",company:"Vertex Digital",email:"omar@vertex.example",score:84,status:"new"},
 {name:"Daniel Reed",title:"Founder",company:"Summit Growth",email:"daniel@summit.example",score:78,status:"contacted"}
] as const;

export async function GET(){
 const ctx=await getWorkspaceContext();
 if(!ctx)return NextResponse.json({leads:seed,provider:"local"});
 const {data:existing,error}=await ctx.supabase.from("leads").select("id,status,score,people(id,full_name,job_title,email,companies(name))").eq("workspace_id",ctx.workspaceId).order("score",{ascending:false});
 if(error)return NextResponse.json({error:error.message},{status:500});
 if((existing??[]).length===0){
   for(const item of seed){
     const companyId=crypto.randomUUID(), personId=crypto.randomUUID();
     const {error:ce}=await ctx.supabase.from("companies").insert({id:companyId,workspace_id:ctx.workspaceId,source:"mock",name:item.company});
     if(ce)continue;
     const {error:pe}=await ctx.supabase.from("people").insert({id:personId,workspace_id:ctx.workspaceId,company_id:companyId,source:"mock",full_name:item.name,job_title:item.title,email:item.email});
     if(pe)continue;
     await ctx.supabase.from("leads").insert({workspace_id:ctx.workspaceId,person_id:personId,company_id:companyId,status:item.status,score:item.score,source:"mock"});
   }
   const {data:seeded}=await ctx.supabase.from("leads").select("id,status,score,people(id,full_name,job_title,email,companies(name))").eq("workspace_id",ctx.workspaceId).order("score",{ascending:false});
   return NextResponse.json({leads:mapLeads(seeded??[]),provider:"supabase"});
 }
 return NextResponse.json({leads:mapLeads(existing??[]),provider:"supabase"});
}
function mapLeads(rows:any[]){return rows.map(x=>({id:x.id,name:x.people?.full_name??"Unknown",title:x.people?.job_title??"",company:x.people?.companies?.name??"",email:x.people?.email??"",score:x.score??0,status:String(x.status??"new").replace(/^./,c=>c.toUpperCase())}));}

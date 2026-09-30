import { localStore } from "@/lib/data/local-store";
import type { Campaign, Conversation, ICP, Opportunity, Workflow, AnalyticsEvent } from "@/lib/data/domain";
import { createClient } from "@/lib/supabase/server";

type Ctx = { supabase: any; userId: string; workspaceId: string } | null;
async function context(): Promise<Ctx> {
  const supabase = await createClient(); if (!supabase) return null;
  const { data: { user } } = await supabase.auth.getUser(); if (!user) return null;
  const { data: member, error } = await supabase.from("workspace_members").select("workspace_id").eq("user_id", user.id).limit(1).maybeSingle();
  if (error) throw error;
  if (member?.workspace_id) return { supabase, userId:user.id, workspaceId:member.workspace_id };
  const workspaceId = crypto.randomUUID();
  const { error: wsError } = await supabase.from("workspaces").insert({id:workspaceId,name:"My Sales Workspace",slug:`workspace-${user.id.slice(0,8)}`,created_by:user.id});
  if (wsError) throw wsError;
  const { error: mError } = await supabase.from("workspace_members").insert({workspace_id:workspaceId,user_id:user.id,role:"owner"}); if (mError) throw mError;
  return { supabase,userId:user.id,workspaceId };
}
const local=<T,>(value:T)=>({value,provider:"local" as const});
const split=(v:string)=>v.split(",").map(x=>x.trim()).filter(Boolean);
const uuid=(v:string)=>/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v);
function upsert<T extends {id:string}>(a:T[],v:T){const i=a.findIndex(x=>x.id===v.id);if(i>=0)a[i]=v;else a.push(v)}
function icp(x:any):ICP{return{id:x.id,name:x.name,industry:(x.industries??[]).join(", "),location:(x.locations??[]).join(", "),employees:(x.company_sizes??[]).join(", "),roles:(x.titles??[]).join(", "),keywords:(x.technologies??[]).join(", "),updatedAt:x.updated_at}}
function campaign(x:any):Campaign{const s=x.settings??{};return{id:x.id,name:x.name,status:x.status,audienceSize:Number(s.audienceSize??0),steps:Number(s.steps??1),sent:Number(s.sent??0),replies:Number(s.replies??0),meetings:Number(s.meetings??0),updatedAt:x.updated_at}}
function conversation(x:any):Conversation{const m=(x.messages??[]).sort((a:any,b:any)=>String(b.created_at).localeCompare(String(a.created_at)))[0];return{id:x.id,contact:"Unassigned",company:"",intent:x.subject??"Conversation",status:x.status,lastMessage:m?.body??"",updatedAt:x.updated_at}}
function opportunity(x:any):Opportunity{return{id:x.id,company:x.name,contact:"Unassigned",value:Number(x.value??0),stage:x.stage,updatedAt:x.updated_at}}
function workflow(x:any):Workflow{return{id:x.id,name:x.name,status:x.status,nodes:x.nodes??[],updatedAt:x.updated_at}}
function event(x:any):AnalyticsEvent{return{id:String(x.id),type:x.event_type,entityId:x.entity_id??"unknown",metadata:x.metadata??{},createdAt:x.created_at}}
export const store={
 async getICP(){const c=await context();if(!c)return local(localStore.icps[0] as ICP);const{data,error}=await c.supabase.from("icps").select("*").eq("workspace_id",c.workspaceId).order("updated_at",{ascending:false}).limit(1).maybeSingle();if(error)throw error;if(data)return{value:icp(data),provider:"supabase" as const};const{data:n,error:e}=await c.supabase.from("icps").insert({workspace_id:c.workspaceId,name:"Default ICP",industries:["SaaS"],locations:["United States"],company_sizes:["11-50"],titles:["Founder","CEO","VP Sales"],technologies:["B2B","workflow","automation"]}).select("*").single();if(e)throw e;return{value:icp(n),provider:"supabase" as const}},
 async saveICP(v:ICP){const c=await context();if(!c){localStore.icps[0]=v;return local(v)}const{id,...rest}=v;const{data,error}=await c.supabase.from("icps").upsert({...(uuid(id)?{id}:{}),workspace_id:c.workspaceId,name:rest.name,industries:split(rest.industry),locations:split(rest.location),company_sizes:split(rest.employees),titles:split(rest.roles),technologies:split(rest.keywords),updated_at:rest.updatedAt}).select("*").single();if(error)throw error;return{value:icp(data),provider:"supabase" as const}},
 async getCampaigns(){const c=await context();if(!c)return local(localStore.campaigns);const{data,error}=await c.supabase.from("campaigns").select("*").eq("workspace_id",c.workspaceId).order("updated_at",{ascending:false});if(error)throw error;return{value:(data??[]).map(campaign),provider:"supabase" as const}},
 async saveCampaign(v:Campaign){const c=await context();if(!c){upsert(localStore.campaigns,v);return local(v)}const{data,error}=await c.supabase.from("campaigns").upsert({...(uuid(v.id)?{id:v.id}:{}),workspace_id:c.workspaceId,name:v.name,status:v.status,settings:{audienceSize:v.audienceSize,steps:v.steps,sent:v.sent,replies:v.replies,meetings:v.meetings},updated_at:v.updatedAt}).select("*").single();if(error)throw error;return{value:campaign(data),provider:"supabase" as const}},
 async getConversations(){const c=await context();if(!c)return local(localStore.conversations);const{data,error}=await c.supabase.from("conversations").select("*, messages(body,created_at)").eq("workspace_id",c.workspaceId).order("updated_at",{ascending:false});if(error)throw error;return{value:(data??[]).map(conversation),provider:"supabase" as const}},
 async saveConversation(v:Conversation){const c=await context();if(!c){upsert(localStore.conversations,v);return local(v)}const{data,error}=await c.supabase.from("conversations").upsert({...(uuid(v.id)?{id:v.id}:{}),workspace_id:c.workspaceId,channel:"email",status:v.status,subject:v.intent,updated_at:v.updatedAt}).select("*").single();if(error)throw error;return{value:conversation(data),provider:"supabase" as const}},
 async getOpportunities(){const c=await context();if(!c)return local(localStore.opportunities);const{data,error}=await c.supabase.from("opportunities").select("*").eq("workspace_id",c.workspaceId).order("updated_at",{ascending:false});if(error)throw error;return{value:(data??[]).map(opportunity),provider:"supabase" as const}},
 async saveOpportunity(v:Opportunity){const c=await context();if(!c){upsert(localStore.opportunities,v);return local(v)}const{data,error}=await c.supabase.from("opportunities").upsert({...(uuid(v.id)?{id:v.id}:{}),workspace_id:c.workspaceId,name:v.company,stage:v.stage,value:v.value,currency:"USD",updated_at:v.updatedAt}).select("*").single();if(error)throw error;return{value:opportunity(data),provider:"supabase" as const}},
 async getWorkflows(){const c=await context();if(!c)return local(localStore.workflows);const{data,error}=await c.supabase.from("workflows").select("*").eq("workspace_id",c.workspaceId).order("updated_at",{ascending:false});if(error)throw error;return{value:(data??[]).map(workflow),provider:"supabase" as const}},
 async saveWorkflow(v:Workflow){const c=await context();if(!c){upsert(localStore.workflows,v);return local(v)}const{data,error}=await c.supabase.from("workflows").upsert({...(uuid(v.id)?{id:v.id}:{}),workspace_id:c.workspaceId,name:v.name,status:v.status,nodes:v.nodes,edges:[],updated_at:v.updatedAt}).select("*").single();if(error)throw error;return{value:workflow(data),provider:"supabase" as const}},
 async getEvents(){const c=await context();if(!c)return local(localStore.events);const{data,error}=await c.supabase.from("analytics_events").select("*").eq("workspace_id",c.workspaceId).order("created_at",{ascending:false});if(error)throw error;return{value:(data??[]).map(event),provider:"supabase" as const}},
 async addEvent(v:AnalyticsEvent){const c=await context();if(!c){localStore.events.push(v);return local(v)}const{data,error}=await c.supabase.from("analytics_events").insert({workspace_id:c.workspaceId,actor_user_id:c.userId,event_type:v.type,entity_id:uuid(v.entityId)?v.entityId:null,metadata:v.metadata,created_at:v.createdAt}).select("*").single();if(error)throw error;return{value:event(data),provider:"supabase" as const}}
};
import type {Campaign,Conversation,ICP,Opportunity,Workflow,AnalyticsEvent} from "./domain";

const seed={
 icps:[{id:"icp-1",name:"B2B SaaS founders",industry:"SaaS",location:"United States",employees:"11-50",roles:"Founder, CEO, VP Sales",keywords:"B2B, workflow, automation",updatedAt:new Date().toISOString()}] as ICP[],
 campaigns:[{id:"cmp-1",name:"Founder outbound",status:"draft",audienceSize:42,steps:3,sent:0,replies:0,meetings:0,updatedAt:new Date().toISOString()}] as Campaign[],
 opportunities:[
  {id:"opp-1",company:"Northstar Software",contact:"Sarah Khan",value:12000,stage:"new",updatedAt:new Date().toISOString()},
  {id:"opp-2",company:"Vertex Digital",contact:"Omar Ahmed",value:18000,stage:"qualified",updatedAt:new Date().toISOString()},
 ] as Opportunity[],
 conversations:[
  {id:"conv-1",contact:"Sarah Khan",company:"Northstar Software",intent:"Interested",status:"open",lastMessage:"Can you send me more details?",updatedAt:new Date().toISOString()},
  {id:"conv-2",contact:"Omar Ahmed",company:"Vertex Digital",intent:"Question",status:"open",lastMessage:"What does implementation look like?",updatedAt:new Date().toISOString()},
 ] as Conversation[],
 workflows:[{id:"wf-1",name:"Outbound prospecting",status:"draft",nodes:[
  {id:"n1",type:"find_companies",title:"Find target companies",config:{}},
  {id:"n2",type:"find_people",title:"Find decision makers",config:{}},
  {id:"n3",type:"score_lead",title:"AI score lead",config:{}},
  {id:"n4",type:"personalize",title:"Personalize email",config:{}},
  {id:"n5",type:"send_email",title:"Queue email",config:{}},
 ],updatedAt:new Date().toISOString()}] as Workflow[],
 events:[] as AnalyticsEvent[],
};
export const localStore=seed;

import { findPeople, searchCompanies, scoreLead, personalizeLead } from "@/lib/services";
import { mockEmailProvider } from "@/lib/providers";
import type { Lead } from "@/lib/providers";
import type { WorkflowNode } from "@/lib/data/domain";

export type WorkflowRunResult={nodeId:string;status:"completed"|"skipped"|"failed";message:string}[];

export async function runWorkflow(nodes:WorkflowNode[]):Promise<WorkflowRunResult>{
 const results:WorkflowRunResult=[];
 let companies=await searchCompanies("");
 for(const node of nodes){
  try{
   if(node.type==="find_companies"){companies=await searchCompanies("");results.push({nodeId:node.id,status:"completed",message:`Found ${companies.length} companies`});continue;}
   if(node.type==="find_people"){
    const people=companies.length?await findPeople(companies[0].id):[];
    results.push({nodeId:node.id,status:"completed",message:`Found ${people.length} decision makers`});continue;
   }
   if(node.type==="score_lead"){
    const company=companies[0]; const people=company?await findPeople(company.id):[];
    if(!people[0]){results.push({nodeId:node.id,status:"skipped",message:"No lead available"});continue;}
    const lead:Lead={...people[0],score:85,status:"new"}; const scored=await scoreLead(lead);
    results.push({nodeId:node.id,status:"completed",message:`Lead scored ${scored.score}`});continue;
   }
   if(node.type==="personalize"){
    const company=companies[0]; const people=company?await findPeople(company.id):[];
    if(!people[0]){results.push({nodeId:node.id,status:"skipped",message:"No lead available"});continue;}
    const lead:Lead={...people[0],score:85,status:"new"}; const copy=await personalizeLead(lead,"our sales workflow");
    results.push({nodeId:node.id,status:"completed",message:`Generated: ${copy.subject}`});continue;
   }
   if(node.type==="send_email"){const people=companies[0]?await findPeople(companies[0].id):[];if(!people[0]?.email){results.push({nodeId:node.id,status:"skipped",message:"No email available"});continue;}const r=await mockEmailProvider.send({to:people[0].email!,subject:"AI Sales Agent test",body:"Review before sending"});results.push({nodeId:node.id,status:"completed",message:`Email ${r.status}`});continue;}
   if(node.type==="wait"){results.push({nodeId:node.id,status:"completed",message:"Wait simulated in local mode"});continue;}
   results.push({nodeId:node.id,status:"completed",message:"Step completed"});
  }catch(error){results.push({nodeId:node.id,status:"failed",message:error instanceof Error?error.message:"Step failed"});}
 }
 return results;
}
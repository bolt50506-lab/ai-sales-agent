import { NextResponse } from "next/server";
import { runWorkflow } from "@/lib/services";
import type { WorkflowNode } from "@/lib/data/domain";
export async function POST(request:Request){
 try{const body=await request.json();const nodes=Array.isArray(body?.nodes)?body.nodes as WorkflowNode[]:[];if(!nodes.length)return NextResponse.json({error:"nodes are required"},{status:400});return NextResponse.json({results:await runWorkflow(nodes),mode:"local"});}
 catch{return NextResponse.json({error:"Workflow run failed"},{status:500});}
}
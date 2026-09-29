import { NextResponse } from "next/server";
import { store } from "@/lib/services/store-service";

export async function GET() {
  return NextResponse.json({ conversations: store.getConversations(), provider: "local" });
}
export async function POST(request: Request) {
  const body = await request.json();
  const current = store.getConversations().find(x=>x.id===body.id);
  if (!current) return NextResponse.json({error:"Conversation not found"},{status:404});
  const updated = store.saveConversation({...current,status:body.human?"human":current.status,lastMessage:typeof body.message==="string"?body.message:current.lastMessage,updatedAt:new Date().toISOString()});
  store.addEvent({id:`evt-${Date.now()}`,type:body.human?"human_takeover":"reply_sent",entityId:updated.id,metadata:{channel:"inbox"},createdAt:new Date().toISOString()});
  return NextResponse.json({conversation:updated,mode:"review-only"});
}
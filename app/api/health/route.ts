import { NextResponse } from "next/server";
import { store } from "@/lib/services/store-service";

export async function GET() {
  const campaigns = store.getCampaigns();
  const workflows = store.getWorkflows();
  const conversations = store.getConversations();
  return NextResponse.json({
    ok: true,
    mode: "local",
    integrations: { ai: "adapter-ready", email: "adapter-ready", crm: "adapter-ready", enrichment: "adapter-ready" },
    data: { campaigns: campaigns.length, workflows: workflows.length, conversations: conversations.length },
    timestamp: new Date().toISOString(),
  });
}

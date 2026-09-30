import { NextResponse } from "next/server";
import { store } from "@/lib/services/store-service";

export async function GET() {
  const events = store.getEvents();
  const counts = events.reduce<Record<string, number>>((acc, event) => {
    acc[event.type] = (acc[event.type] ?? 0) + 1;
    return acc;
  }, {});
  const campaigns = store.getCampaigns();
  const opportunities = store.getOpportunities();
  const conversations = store.getConversations();

  const pipelineValue = opportunities.reduce((sum, opportunity) => sum + opportunity.value, 0);
  const openConversations = conversations.filter((conversation) => conversation.status === "open").length;
  const activeCampaigns = campaigns.filter((campaign) => campaign.status === "active").length;
  const sent = campaigns.reduce((sum, campaign) => sum + campaign.sent, 0);
  const replies = campaigns.reduce((sum, campaign) => sum + campaign.replies, 0);
  const meetings = campaigns.reduce((sum, campaign) => sum + campaign.meetings, 0);

  return NextResponse.json({
    provider: "local",
    events,
    counts,
    summary: {
      campaigns: campaigns.length,
      activeCampaigns,
      pipelineValue,
      openConversations,
      sent,
      replies,
      meetings,
      replyRate: sent ? Number(((replies / sent) * 100).toFixed(1)) : 0,
      meetingRate: sent ? Number(((meetings / sent) * 100).toFixed(1)) : 0,
    },
  });
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const now = new Date().toISOString();
  const event = {
    id: `evt-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    type: typeof body.type === "string" ? body.type : "activity",
    entityId: typeof body.entityId === "string" ? body.entityId : "unknown",
    metadata: body.metadata && typeof body.metadata === "object" ? body.metadata : {},
    createdAt: now,
  };
  store.addEvent(event);
  return NextResponse.json({ event }, { status: 201 });
}

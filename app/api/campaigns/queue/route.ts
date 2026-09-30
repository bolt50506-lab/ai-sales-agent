import { NextResponse } from "next/server";
import { queueCampaignEmails } from "@/lib/services/campaign-service";
import { store } from "@/lib/services/store-service";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const campaignId = typeof body.campaignId === "string" ? body.campaignId : "";
  const campaign = store.getCampaigns().find((item) => item.id === campaignId);
  if (!campaign) return NextResponse.json({ error: "Campaign not found" }, { status: 404 });

  const emails = Array.isArray(body.emails) ? body.emails : [];
  const result = await queueCampaignEmails(emails);
  const updated = store.saveCampaign({
    ...campaign,
    sent: campaign.sent + result.queued,
    status: result.queued ? "active" : campaign.status,
    updatedAt: new Date().toISOString(),
  });

  store.addEvent({
    id: `evt-${Date.now()}`,
    type: "campaign_queued",
    entityId: campaign.id,
    metadata: { queued: result.queued, mode: result.mode },
    createdAt: new Date().toISOString(),
  });

  return NextResponse.json({ campaign: updated, ...result });
}

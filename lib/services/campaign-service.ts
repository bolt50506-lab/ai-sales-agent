export type CampaignStep = { id: string; name: string; channel: "email"; delayDays: number; subject: string; body: string };
export type CampaignDraft = { name: string; audienceSize: number; steps: CampaignStep[] };
export const defaultCampaign: CampaignDraft = { name: "New outbound sequence", audienceSize: 42, steps: [
{id:"step-1",name:"Initial outreach",channel:"email",delayDays:0,subject:"Idea for {{company}}",body:"Hi {{first_name}}, I noticed {{company}} and thought our solution may be relevant to your team."},
{id:"step-2",name:"Follow-up #1",channel:"email",delayDays:2,subject:"Following up",body:"Following up on my previous note. Would a short conversation be useful?"},
{id:"step-3",name:"Follow-up #2",channel:"email",delayDays:4,subject:"Worth exploring?",body:"Happy to share a short overview if this is relevant to your priorities."}]};

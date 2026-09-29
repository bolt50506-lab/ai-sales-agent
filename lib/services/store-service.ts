import { localStore } from "@/lib/data/local-store";
import type {Campaign,Conversation,ICP,Opportunity,Workflow} from "@/lib/data/domain";
export const store={
 getICP:()=>localStore.icps[0] as ICP,
 saveICP:(value:ICP)=>{localStore.icps[0]=value;return value;},
 getCampaigns:()=>localStore.campaigns,
 getConversations:()=>localStore.conversations,
 getOpportunities:()=>localStore.opportunities,
 getWorkflows:()=>localStore.workflows,
 saveCampaign:(value:Campaign)=>{const i=localStore.campaigns.findIndex(x=>x.id===value.id);if(i>=0)localStore.campaigns[i]=value;else localStore.campaigns.push(value);return value;},
 saveConversation:(value:Conversation)=>{const i=localStore.conversations.findIndex(x=>x.id===value.id);if(i>=0)localStore.conversations[i]=value;else localStore.conversations.push(value);return value;},
 saveOpportunity:(value:Opportunity)=>{const i=localStore.opportunities.findIndex(x=>x.id===value.id);if(i>=0)localStore.opportunities[i]=value;else localStore.opportunities.push(value);return value;},
 saveWorkflow:(value:Workflow)=>{const i=localStore.workflows.findIndex(x=>x.id===value.id);if(i>=0)localStore.workflows[i]=value;else localStore.workflows.push(value);return value;},
};
import { store } from "@/lib/services/store-service";
export function recordEvent(type:string,entityId:string,metadata:Record<string,unknown>={}){
 const now=new Date().toISOString();
 return store.addEvent({id:`evt-${Date.now()}-${Math.random().toString(36).slice(2,8)}`,type,entityId,metadata,createdAt:now});
}
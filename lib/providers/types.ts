export type ProviderStatus = "mock" | "configured" | "disabled" | "error";
export type ProviderCapability = "companies" | "people" | "enrichment" | "ai" | "email" | "calendar";
export type ProviderHealth = { id:string; name:string; capability:ProviderCapability; status:ProviderStatus; configured:boolean };

export type Company={id:string;name:string;domain:string;industry:string;location:string;employees:number;description:string;source:string};
export type Person={id:string;companyId:string;name:string;title:string;email:string|null;linkedin:string|null;source:string};
export type Lead=Person&{score:number;status:"new"|"qualified"|"contacted"|"replied"};
export type CalendarEvent={id:string;title:string;start:string;end:string;status:"proposed"|"scheduled"|"cancelled"};
export type EnrichmentResult={companyId?:string;personId?:string;summary:string;signals:string[];source:string};
export interface CompanyProvider{search(query:string,filters?:Record<string,unknown>):Promise<Company[]>}
export interface PeopleProvider{search(companyId:string,query?:string):Promise<Person[]>}
export interface AIProvider{scoreLead(lead:Lead):Promise<{score:number;reasons:string[]}>;personalize(input:{lead:Lead;product:string}):Promise<{subject:string;body:string}>}
export interface EmailProvider{send(input:{to:string;subject:string;body:string}):Promise<{id:string;status:"queued"|"sent"}>}
export interface CalendarProvider{createEvent(input:{title:string;start:string;end:string;attendee:string}):Promise<CalendarEvent>}
export interface EnrichmentProvider{enrich(input:{companyId?:string;personId?:string}):Promise<EnrichmentResult>}

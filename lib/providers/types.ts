export type Company={id:string;name:string;domain:string;industry:string;location:string;employees:number;description:string;source:string};
export type Person={id:string;companyId:string;name:string;title:string;email:string|null;linkedin:string|null;source:string};
export type Lead=Person&{score:number;status:"new"|"qualified"|"contacted"|"replied"};
export interface CompanyProvider{search(query:string,filters?:Record<string,unknown>):Promise<Company[]>}
export interface PeopleProvider{search(companyId:string,query?:string):Promise<Person[]>}
export interface AIProvider{scoreLead(lead:Lead):Promise<{score:number;reasons:string[]}>;personalize(input:{lead:Lead;product:string}):Promise<{subject:string;body:string}>}
export interface EmailProvider{send(input:{to:string;subject:string;body:string}):Promise<{id:string;status:"queued"|"sent"}>}
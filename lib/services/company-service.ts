import { mockCompanyProvider } from "@/lib/providers";
import type { Company } from "@/lib/providers";
export async function searchCompanies(query="",filters?:Record<string,unknown>):Promise<Company[]>{
 const companies=await mockCompanyProvider.search(query,filters);
 const industry=typeof filters?.industry==="string"?filters.industry.toLowerCase():"";
 return industry&&industry!=="all industries"?companies.filter(c=>c.industry.toLowerCase()===industry):companies;
}
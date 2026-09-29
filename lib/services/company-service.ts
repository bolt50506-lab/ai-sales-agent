import { mockCompanyProvider } from "@/lib/providers";
import type { Company } from "@/lib/providers";

export async function searchCompanies(query = "", filters?: Record<string, unknown>): Promise<Company[]> {
  return mockCompanyProvider.search(query, filters);
}

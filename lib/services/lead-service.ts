import { mockPeopleProvider } from "@/lib/providers";
import type { Person } from "@/lib/providers";

export async function findPeople(companyId: string, query = ""): Promise<Person[]> {
  const people = await mockPeopleProvider.search(companyId, query);
  if (!query.trim()) return people;
  const q = query.toLowerCase();
  return people.filter((person) => [person.name, person.title, person.email ?? ""].join(" ").toLowerCase().includes(q));
}

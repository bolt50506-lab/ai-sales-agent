import { findPeople } from "@/lib/services/lead-service";
import { searchCompanies } from "@/lib/services/company-service";
import { scoreLead, personalizeLead } from "@/lib/services/ai-service";
import { mockEmailProvider } from "@/lib/providers";
import type { Lead, Person, Company } from "@/lib/providers";
import type { WorkflowNode } from "@/lib/data/domain";

export type WorkflowRunResult = {
  nodeId: string;
  status: "completed" | "skipped" | "failed";
  message: string;
};

type WorkflowContext = {
  companies: Company[];
  people: Person[];
  lead: Lead | null;
  personalization: { subject: string; body: string } | null;
};

function firstAvailable<T>(items: T[]) {
  return items[0] ?? null;
}

function conditionPasses(node: WorkflowNode, context: WorkflowContext) {
  const field = String(node.config?.field ?? "lead");
  const operator = String(node.config?.operator ?? "exists");
  const value = node.config?.value;

  if (field === "lead.score") {
    const score = context.lead?.score;
    if (typeof score !== "number") return false;
    if (operator === "gte") return score >= Number(value ?? 0);
    if (operator === "gt") return score > Number(value ?? 0);
    if (operator === "lte") return score <= Number(value ?? 0);
    if (operator === "lt") return score < Number(value ?? 0);
    if (operator === "eq") return score === Number(value ?? 0);
  }

  if (field === "lead.email") {
    const exists = Boolean(context.lead?.email);
    return operator === "exists" ? exists : !exists;
  }

  if (field === "company") {
    const exists = context.companies.length > 0;
    return operator === "exists" ? exists : !exists;
  }

  return Boolean(context.lead);
}

export async function runWorkflow(nodes: WorkflowNode[]): Promise<WorkflowRunResult[]> {
  const results: WorkflowRunResult[] = [];
  const context: WorkflowContext = {
    companies: [],
    people: [],
    lead: null,
    personalization: null,
  };

  for (const node of nodes) {
    try {
      if (node.type === "trigger") {
        results.push({ nodeId: node.id, status: "completed", message: "Workflow trigger accepted" });
        continue;
      }

      if (node.type === "find_companies") {
        const query = String(node.config?.query ?? "");
        context.companies = await searchCompanies(query);
        results.push({ nodeId: node.id, status: "completed", message: `Found ${context.companies.length} companies` });
        continue;
      }

      if (node.type === "find_people") {
        const company = firstAvailable(context.companies);
        if (!company) {
          results.push({ nodeId: node.id, status: "skipped", message: "No company available" });
          continue;
        }
        context.people = await findPeople(company.id);
        results.push({ nodeId: node.id, status: "completed", message: `Found ${context.people.length} decision makers` });
        continue;
      }

      if (node.type === "score_lead") {
        const person = firstAvailable(context.people);
        if (!person) {
          results.push({ nodeId: node.id, status: "skipped", message: "No lead available" });
          continue;
        }
        context.lead = { ...person, score: 0, status: "new" };
        const scored = await scoreLead(context.lead);
        context.lead = { ...context.lead, score: scored.score };
        results.push({ nodeId: node.id, status: "completed", message: `Lead scored ${scored.score}` });
        continue;
      }

      if (node.type === "personalize") {
        if (!context.lead) {
          const person = firstAvailable(context.people);
          if (!person) {
            results.push({ nodeId: node.id, status: "skipped", message: "No lead available" });
            continue;
          }
          context.lead = { ...person, score: 0, status: "new" };
        }
        const product = String(node.config?.product ?? "our sales workflow");
        context.personalization = await personalizeLead(context.lead, product);
        results.push({ nodeId: node.id, status: "completed", message: `Generated: ${context.personalization.subject}` });
        continue;
      }

      if (node.type === "send_email") {
        if (!context.lead?.email) {
          results.push({ nodeId: node.id, status: "skipped", message: "No lead email available" });
          continue;
        }
        const copy = context.personalization ?? {
          subject: String(node.config?.subject ?? "AI Sales Agent test"),
          body: String(node.config?.body ?? "Review before sending"),
        };
        const result = await mockEmailProvider.send({ to: context.lead.email, subject: copy.subject, body: copy.body });
        results.push({ nodeId: node.id, status: "completed", message: `Email ${result.status}` });
        continue;
      }

      if (node.type === "wait") {
        const duration = String(node.config?.duration ?? "simulated");
        results.push({ nodeId: node.id, status: "completed", message: `Wait simulated in local mode (${duration})` });
        continue;
      }

      if (node.type === "condition") {
        const passed = conditionPasses(node, context);
        results.push({ nodeId: node.id, status: passed ? "completed" : "skipped", message: passed ? "Condition passed" : "Condition not met" });
        continue;
      }

      if (node.type === "crm_task") {
        const title = String(node.config?.title ?? "Follow up with lead");
        results.push({ nodeId: node.id, status: "completed", message: `CRM task queued locally: ${title}` });
        continue;
      }

      results.push({ nodeId: node.id, status: "completed", message: "Step completed" });
    } catch (error) {
      results.push({ nodeId: node.id, status: "failed", message: error instanceof Error ? error.message : "Step failed" });
    }
  }

  return results;
}

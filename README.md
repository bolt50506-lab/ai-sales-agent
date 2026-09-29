# AI Sales Agent

A provider-independent AI sales intelligence and outbound workspace built with Next.js, TypeScript, Tailwind and Supabase-ready architecture.

## Current local-first workspace

The application is usable without paid API keys and includes:

- Dashboard and workspace navigation
- ICP builder
- Company finder
- Lead finder with AI scoring
- Lead intelligence detail pages
- Campaign builder with safe local test queue
- AI inbox with human review flow
- CRM pipeline
- Workflow builder with local execution engine
- Analytics workspace
- Settings and provider registry
- Provider interfaces for companies, people, AI, email, calendar and enrichment
- API boundaries for company search, lead scoring, AI personalization, campaigns and workflows

## Provider architecture

External services are isolated behind interfaces in `lib/providers`. Mock implementations run locally now; real providers can replace them without rewriting the product workflows.

## Run locally

```bash
npm install
npm run dev
```

Then open `http://localhost:3000`.

No external provider key is required for the current local-first mode.

## Product areas

Dashboard · ICP · Companies · Leads · Campaigns · Inbox · CRM · Workflows · Analytics · Integrations/Settings

## Safety model

Local outbound execution is review-only. Provider secrets belong on the server when real integrations are added.

## Next integration layer

Supabase persistence/auth, real AI providers, company/enrichment providers, email delivery, calendar integrations and automation connectors can be added behind the existing provider contracts.

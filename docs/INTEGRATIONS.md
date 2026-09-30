# Integration Map

The product is designed to run in local/mock mode first. External providers are adapters, so API keys can be added later without rebuilding the product UI.

## Required integration slots

| Capability | Current mode | Later provider examples |
|---|---|---|
| AI generation | local adapter | Gemini, Groq, OpenAI-compatible API |
| Company discovery | mock adapter | Apollo, Hunter, People Data Labs, custom source |
| Person enrichment | mock adapter | Apollo, Hunter, People Data Labs, custom source |
| Email delivery | review-only mock | Resend, Brevo, SMTP, Gmail API |
| CRM | local store | HubSpot, Pipedrive, Salesforce |
| Calendar | adapter-ready | Google Calendar, Cal.com |
| Database | local in-memory store | Supabase/Postgres |

## Integration rules

1. Never put provider-specific API calls in React pages.
2. Keep provider credentials server-side only.
3. Normalize external results into the domain types in `lib/data/domain.ts`.
4. Keep mock adapters available for development and demos.
5. Add retries, timeouts and provider error normalization inside adapters.
6. Never expose supplier API keys or raw provider payloads to the browser unless explicitly required.

## MVP completion definition

The free/mock MVP is complete when dashboard, ICP, discovery, leads, scoring, personalization, campaigns, inbox, opportunities, workflows, analytics, provider settings, loading/error/empty states, and end-to-end local flows work without external API keys.

## Production integration order

1. Database persistence
2. AI provider
3. Email delivery
4. Company/person enrichment
5. CRM sync
6. Calendar
7. Webhooks and background jobs

Each integration should replace an adapter, not rewrite the application.

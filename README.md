# AI Sales Agent

An AI-powered sales intelligence, lead generation, outreach, inbox, CRM, and workflow automation platform.

## Status

Initial foundation — provider-independent architecture. External APIs will be integrated after the core product is complete.

## Product modules

- Dashboard
- ICP Builder
- Company Finder
- People / Lead Finder
- Lead Intelligence & Scoring
- Campaigns
- AI Inbox / Reply Agent
- CRM
- Workflow Builder
- Analytics
- Integrations

## Architecture principle

All external data, enrichment, AI, email, calendar, and automation services are accessed through provider interfaces. Development can therefore run with local/mock providers and real APIs can be added later without redesigning the application.

## Development

The application is being built incrementally, with each module kept independently replaceable and testable.

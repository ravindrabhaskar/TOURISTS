# PROJECT SANCHARI — Master Implementation Plan

> Andhra Pradesh Intelligent Tourism Platform — authoritative technical plan derived from the PRD.
> Status tracker: `docs/IMPLEMENTATION_STATUS.md` · Session handoff: `docs/NEXT_STEPS.md`

## 1. PRD Requirement Matrix (condensed)

| PRD Area | Requirement | Maps to |
|---|---|---|
| Discovery | Home, destinations, attractions, districts, map, search | `app/(public)/*`, `destinations` domain, SearchService, AnalyticsEvents |
| AI Planner | Conversational/wizard planner → structured itinerary | `trips` domain + `ai` gateway + deterministic `itinerary-engine` |
| Itinerary intelligence | Distances, hours, meals, budget, feasibility | `server/domains/trips/engine/*` (pure functions, unit-tested) |
| Dynamic rescheduling | "Skip museum", "running late", weather changes | `engine/modify.ts` scoped day recompute + locked/booked preservation |
| AI assistant | Grounded tool-calling chat, multilingual, voice input | `ai/gateway`, `ai/tools`, Web Speech wrapper |
| Location aware | /near-me, distance rings, emergency POIs | Haversine SQL (`PostGIS` upgrade path documented) |
| Weather | Destination + trip weather awareness | Open-Meteo provider (keyless), cache, graceful degrade |
| Events & festivals | Lifecycle, discovery, itinerary integration | `events` domain + engine candidate boost |
| Stays | Property info vs live availability separation | `stays` domain; availability = sandbox until provider configured |
| Booking | Unified booking state machine, idempotency | `bookings` domain, `BookingStatus` transitions server-validated |
| Payments | Provider abstraction, webhooks, refunds, never trust client | `payments` domain: SandboxProvider + RazorpayProvider (HMAC verify) |
| Reviews | Ratings, moderation, helpfulness, reports | `reviews` domain + admin moderation queue |
| Gamification | Points ledger, badges, levels, leaderboard, challenges | `gamification` domain (immutable ledger, balanceAfter) |
| Personalization | Signals → recommendations, cold-start fallbacks | `recommendations` domain |
| Auth & RBAC | Email/password, OTP architecture, roles, sessions | `auth` domain, jose JWT httpOnly cookie, tokenVersion logout-all |
| Partner portal | Registration → approval → listings → bookings | `/partner` + PartnerProfile approval workflow + audit |
| Admin portal | Metrics, CMS, moderation, config, audit logs | `/admin/*` server actions guarded by RBAC + AuditLog rows |
| CMS | Content pages, FAQs, homepage sections, alerts | ContentPage, FAQ, HomepageSection, SafetyAlert models |
| Emergency/safety | Contacts, alerts, no fabricated status | EmergencyContact + SafetyAlert (admin-issued only) |
| Accessibility | WCAG-minded semantics, keyboard, alt text, reduced motion | Design system + page patterns |
| i18n | EN/TE/HI chrome, content translation-ready | dictionary i18n via cookie + `nameTe`/translation columns |
| Voice | Speech-to-text abstraction with text fallback | `VoiceButton` (feature-detected) |
| SEO | Metadata, JSON-LD, sitemaps, clean URLs | App Router metadata API, `sitemap.ts`, `robots.ts`, schema.org |
| PWA/Mobile-first | 320px+, manifest, installable metadata | responsive tokens + `manifest.ts` |
| Notifications | In-app center, channel adapters | Notification model + adapters (in-app live; email/push/SMS interfaces) |
| Analytics | Event taxonomy, collection endpoint, dashboards | AnalyticsEvent table + `/api/v1/analytics/event` + admin metrics |
| Observability | Request IDs, structured logs, health/readiness | logger + middleware correlation IDs + `/api/health` |
| Security | RBAC, rate limits, headers, validation, audit | middleware, zod schemas, rbac guard, AuditLog, Config/FeatureFlag |
| Data import | CSV/JSON ingest w/ validation + reports | `scripts/import-data.ts` + docs/DATA_IMPORT.md |
| Testing | Unit/integration gates in CI | vitest suites (engine, rbac, gamification, payments, hours) |

Full per-feature status lives in `docs/IMPLEMENTATION_STATUS.md`.

## 2. Architecture

**Modular monolith first** (PRD-sanctioned): one deployable Next.js 15 app with strict internal module boundaries; extraction points documented. No premature microservices.

```text
src/
  app/                  # routes (public, auth, dashboard, admin, partner, api/v1)
  components/ui/        # design system
  components/{layout,map,assistant,destination,...}/
  lib/                  # env(zod), logger, http envelope, rate-limit, utils
  server/
    db.ts               # Prisma singleton
    auth/               # password, session(JWT), rbac, guards
    domains/
      geography destinations events stays search trips reviews
      gamification notifications bookings payments recommendations
      cms analytics audit admin ai
    integrations/       # weather, maps/routing, email, storage interfaces
prisma/                 # schema + seed (+ data/)
scripts/                # import tooling, dev-db
docs/                   # living documentation
tests/ -> colocated *.test.ts near modules (vitest)
```

Key decisions (documented assumptions):
1. **Next.js route handlers = REST API** `/api/v1/*` with a typed response envelope; NestJS-style layering inside `server/domains`. Replaceable later.
2. **Destination model unifies cities and POIs** (`type` enum + optional self-parent). Avoids duplicate attraction entity while supporting both discovery surfaces. Documented trade-off.
3. **Geospatial**: indexed lat/lng + haversine SQL today; PostGIS DDL provided under `infrastructure/postgis-upgrade.sql` for production scale.
4. **Money as integer rupees** at domain boundary; paise conversion isolated in payment adapter.
5. **Deterministic-first AI**: LLM never invents facts; tools return platform data; engine math is pure TypeScript.
6. **Sandbox labeling**: every non-live integration is visibly marked (payments sandbox badge, mock AI provider notice).

## 3. Database Architecture

PostgreSQL 16 (+optional PostGIS). ~35 tables covering geography, catalog, users, trips, commerce, engagement, CMS, ops. UUID PKs, timestamps on all, FK constraints, targeted indexes (status/district/type/popularity, trip ownership, ledger history, analytics name+time). Immutable ledgers: RewardLedger, AuditLog, Payment/WebhookEvent. See `docs/DATABASE.md`.

## 4. Implementation Phases

| Phase | Scope | Gate |
|---|---|---|
| 0 | Repo audit (empty), this plan | done |
| 1 | Scaffold, design system, env, DB schema, auth core | build green |
| 2 | Tourism data domains + APIs + seed importers | API smoke tests |
| 3 | Public experience (home/discover/detail/map/search/events/stays/near-me) | manual pass 320–1440px |
| 4 | User platform (auth UI, dashboard, favorites, trips, reviews, prefs) | auth tests |
| 5 | AI gateway + assistant + planner + rescheduling | engine unit tests |
| 6 | Booking + sandbox payments + wallet/docs | idempotency tests |
| 7 | Engagement (notifications, gamification, sharing) | ledger tests |
| 8 | Partner portal + admin portal + CMS + config + audit | RBAC tests |
| 9 | SEO + PWA + accessibility + performance passes | lighthouse-minded review |
| 10 | Security hardening + final audit + docs | all gates green |

## 5. Completion Checklist (per feature)
UI → API → authorization → validation → business logic → persistence → error/empty/loading states → analytics → tests → docs → status tracker updated.

## 6. Environment Strategy
`.env.example` groups DATABASE_, AUTH_, AI_, WEATHER_, MAPS_, PAYMENT_, EMAIL_, STORAGE_. Startup validates via zod; missing optional creds ⇒ provider falls back to mock **with visible labeling**. Real secrets never committed.

## 7. Known External Dependencies
- Production Postgres/Redis (docker-compose provided; embedded PG dev script for keyless local run).
- Live hotel availability, SMS/email/push delivery, DigiLocker, traffic feeds: interface-complete, awaiting credentials (tracked in IMPLEMENTATION_STATUS).

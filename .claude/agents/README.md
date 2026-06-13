# Tim Agent — ThreadsGrowth AI

Definisi subagent (Claude Code) yang merepresentasikan peran tim untuk membangun & mengoperasikan produk AI ini. Claude akan otomatis mendelegasikan ke agent yang relevan, atau panggil manual: *"pakai agent fullstack-developer untuk …"*.

| Agent | Peran | Dipakai untuk |
|---|---|---|
| **ai-product-manager** | AI Product Manager | Scoping fitur, spec, prioritas roadmap, acceptance criteria |
| **product-owner** | Owner (proses bisnis) | Kebijakan workflow, mode auto-reply, cadence, go/no-go, guardrail |
| **business-analyst** | Business Analyst | KPI dashboard, SQL analitik, audit data, insight |
| **fullstack-developer** | Developer | Implementasi kode (Next.js + Supabase + Repliz + AI + MCP) |
| **content-strategist** | Content Creative | Persona, tuning prompt AI, kualitas & tone konten Threads |
| **ux-designer** | UI/UX Designer | Audit & polish UX, tipografi, hierarki (pakai skill ui-ux-pro-max) |
| **qa-reviewer** | QA / Reviewer | Review kode, keamanan/RLS, build & smoke test sebelum rilis |

## Alur kerja antar-agent (umum)
`product-owner` (apa yang dibutuhkan bisnis) → `ai-product-manager` (spec + prioritas) → `fullstack-developer` (bangun) → `content-strategist`/`ux-designer` (kualitas konten & UX) → `business-analyst` (ukur) → `qa-reviewer` (verifikasi sebelum done).

Semua agent sadar konteks ThreadsGrowth AI: `CLAUDE.md` (spec), stack Next.js 16 + Supabase (RLS, pgvector, pgmq/pg_cron), Repliz, AI provider abstraction (Gemini default), multi-tenant workspace + invite ala n8n.

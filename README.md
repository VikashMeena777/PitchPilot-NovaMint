# 🚀 PitchMint

**AI-Powered Cold Outreach SaaS** — Automate prospect research, email personalization, and sequence management with intelligent AI.

![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)
![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?logo=supabase)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript)

---

## ✨ Features

### Core
- **AI Prospect Research** — Automatically scrape web + analyze prospects with Groq/Gemini
- **AI Email Generation** — Personalized cold emails using prospect research data
- **Multi-Step Sequences** — Visual drag-and-drop email sequence builder
- **A/B Testing** — Split test subject lines and email bodies per step
- **Condition Steps** — Branch sequences based on opens, clicks, replies
- **Bulk Actions** — Mass status updates, tagging, CSV export, and deletion

### Deliverability
- **Open Tracking** — Pixel-based open detection
- **Click Tracking** — Link rewriting with redirect tracking
- **Bounce Processing** — Auto-handle hard/soft bounces
- **Reply Detection** — AI-categorized replies (interested, OOO, unsubscribe, etc.)
- **Unsubscribe Management** — CAN-SPAM compliant with one-click unsubscribe

### Platform
- **Dashboard** — Real-time KPIs, activity feed, quick actions
- **Analytics** — Funnel visualization, benchmarks, conversion tracking
- **Email Templates** — Reusable template library with categories
- **Billing** — Cashfree integration with INR pricing (₹349/₹899/₹1999)
- **Webhook API** — External integrations via API key auth
- **Cookie Consent** — GDPR-compliant consent banner

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 16 (App Router), React 19, TypeScript |
| Styling | Tailwind CSS, Framer Motion, Shadcn/UI |
| Backend | Next.js Server Actions, API Routes |
| Database | Supabase (PostgreSQL + RLS) |
| AI | Groq (Llama 3.3) + Google Gemini (failover) |
| Email | Resend API |
| Billing | Cashfree Subscriptions |
| Scraping | Cheerio + Serper API |

---

## 📦 Getting Started

### Prerequisites
- Node.js 18+
- A Supabase project
- API keys for Groq, Resend, Serper

### Installation

```bash
# Clone the repo
git clone https://github.com/your-username/pitchmint.git
cd pitchmint

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env.local

# Run development server
npm run dev
```

### Environment Variables

See [`.env.example`](.env.example) for all required variables.

---

## 📁 Project Structure

```
src/
├── app/
│   ├── (app)/           # Authenticated pages (dashboard, prospects, etc.)
│   ├── (auth)/          # Login, signup pages
│   ├── api/
│   │   ├── cron/        # Background jobs (send-emails, process-replies, etc.)
│   │   ├── emails/      # Email tracking, test endpoints
│   │   ├── billing/     # Cashfree subscription management
│   │   └── webhooks/    # Inbound webhook API
│   ├── privacy/         # Privacy Policy
│   └── terms/           # Terms of Service
├── components/
│   ├── ui/              # Shadcn/UI components (22 components)
│   └── *.tsx            # Feature components (modals, toolbars, etc.)
├── lib/
│   ├── actions/         # Server actions (user, prospects, sequences, emails, AI)
│   ├── ai/              # AI engine (Groq + Gemini)
│   ├── billing/         # Cashfree integration
│   ├── email/           # Email sender with tracking
│   ├── scraping/        # Web scraping pipeline
│   ├── supabase/        # Client, server, admin clients
│   └── utils/           # Constants, validators, encryption
└── middleware.ts         # Auth protection
```

---

## 🗄 Database Schema

8 tables with 28 RLS policies and 17 performance indexes:

| Table | Purpose |
|-------|---------|
| `users` | User profiles, settings, billing |
| `prospects` | Contact data + AI research |
| `sequences` | Email sequence configuration |
| `sequence_steps` | Individual steps with A/B test + conditions |
| `sequence_enrollments` | Prospect enrollment tracking |
| `emails` | Sent emails with tracking data |
| `email_templates` | Reusable email templates |
| `analytics_daily` | Pre-aggregated daily stats |

---

## ⏰ Background Jobs

Configured via [Vercel Cron](vercel.json):

| Job | Schedule | Purpose |
|-----|----------|---------|
| `send-emails` | Every 5 min | Process email queue |
| `step-sequences` | Every 10 min | Advance sequence enrollments |
| `process-replies` | Every 10 min | AI-categorize replies, stop sequences |
| `research-prospects` | Every 15 min | Auto-research new prospects |
| `process-bounces` | Every 30 min | Handle email bounces |
| `daily-analytics` | Daily 2 AM | Aggregate daily stats |

---

## 🔗 Webhook API

External systems can integrate via the webhook API:

```bash
# Add a prospect
curl -X POST https://your-app.vercel.app/api/webhooks/inbound \
  -H "X-API-Key: pp_your_api_key" \
  -H "Content-Type: application/json" \
  -d '{"action": "add_prospect", "data": {"email": "lead@example.com", "first_name": "Jane"}}'
```

**Available actions:** `add_prospect`, `update_status`, `enroll_sequence`, `list_sequences`

---

## 🚀 Deployment

```bash
# Build for production
npm run build

# Deploy to Vercel
vercel --prod
```

---

## 📄 License

MIT — Built with ❤️ by Vikash

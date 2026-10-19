```text
growers-journy/
├── client/
│   ├── public/
│   │   ├── images/
│   │   ├── icons/
│   │   └── favicon.ico
│   ├── src/
│   │   ├── app/
│   │   │   ├── (public)/
│   │   │   │   ├── page.tsx
│   │   │   │   ├── services/
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── work/
│   │   │   │   │   ├── page.tsx
│   │   │   │   │   └── [slug]/
│   │   │   │   │       └── page.tsx
│   │   │   │   ├── about/
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── process/
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── contact/
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── privacy-policy/
│   │   │   │   │   └── page.tsx
│   │   │   │   └── terms/
│   │   │   │       └── page.tsx
│   │   │   ├── (auth)/
│   │   │   │   └── login/
│   │   │   │       └── page.tsx
│   │   │   ├── admin/
│   │   │   │   ├── layout.tsx
│   │   │   │   ├── page.tsx
│   │   │   │   ├── inquiries/
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── clients/
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── projects/
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── services/
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── portfolio/
│   │   │   │   │   └── page.tsx
│   │   │   │   └── invoices/
│   │   │   │       └── page.tsx
│   │   │   ├── portal/
│   │   │   │   ├── layout.tsx
│   │   │   │   ├── page.tsx
│   │   │   │   ├── projects/
│   │   │   │   │   └── page.tsx
│   │   │   │   └── invoices/
│   │   │   │       └── page.tsx
│   │   │   ├── layout.tsx
│   │   │   ├── globals.css
│   │   │   ├── error.tsx
│   │   │   ├── not-found.tsx
│   │   │   ├── loading.tsx
│   │   │   ├── sitemap.ts
│   │   │   └── robots.ts
│   │   ├── components/
│   │   │   ├── ui/
│   │   │   ├── layout/
│   │   │   └── shared/
│   │   ├── features/
│   │   │   ├── auth/
│   │   │   ├── inquiries/
│   │   │   ├── services/
│   │   │   ├── portfolio/
│   │   │   ├── projects/
│   │   │   ├── invoices/
│   │   │   └── notifications/
│   │   ├── lib/
│   │   │   ├── api/
│   │   │   ├── auth/
│   │   │   ├── validation/
│   │   │   └── utils.ts
│   │   ├── hooks/
│   │   └── types/
│   ├── .env.example
│   ├── package.json
│   ├── tsconfig.json
│   └── next.config.ts
│
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   ├── env.ts
│   │   │   ├── database.ts
│   │   │   └── cors.ts
│   │   ├── middleware/
│   │   │   ├── authenticate.ts
│   │   │   ├── authorize.ts
│   │   │   ├── validate.ts
│   │   │   ├── rate-limit.ts
│   │   │   └── error-handler.ts
│   │   ├── modules/
│   │   │   ├── auth/
│   │   │   ├── users/
│   │   │   ├── inquiries/
│   │   │   ├── services/
│   │   │   ├── portfolio/
│   │   │   ├── clients/
│   │   │   ├── projects/
│   │   │   ├── milestones/
│   │   │   ├── invoices/
│   │   │   ├── payments/
│   │   │   ├── notifications/
│   │   │   └── team/
│   │   ├── integrations/
│   │   │   ├── email/
│   │   │   ├── payments/
│   │   │   ├── ai/
│   │   │   └── mcp/
│   │   ├── routes/
│   │   │   └── index.ts
│   │   ├── services/
│   │   ├── utils/
│   │   ├── app.ts
│   │   └── server.ts
│   ├── tests/
│   ├── .env.example
│   ├── package.json
│   └── tsconfig.json
│
├── packages/
│   └── contracts/
│       ├── src/
│       │   ├── types/
│       │   └── schemas/
│       ├── package.json
│       └── tsconfig.json
│
├── docs/
│   ├── PRD.md
│   ├── DESIGN.md
│   ├── ARCHITECTURE.md
│   ├── DATABASE.md
│   ├── API.md
│   ├── README.md
│   ├── Project Implementation.md
│   ├── Setup.md
│   ├── Feature Development.md
│   ├── Authentication & Security.md
│   ├── MCP connection.md
│   ├── Integration.md
│   ├── Testing & QA.md
│   └── Debugging.md
│
├── AGENTS.md
├── README.md
├── .gitignore
├── package.json
├── package-lock.json
└── .env.example
```

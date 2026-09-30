# ScamCheck

ScamCheck is a responsive consumer-safety application for checking suspicious messages, screenshots, links, phone numbers, and QR destinations before clicking, paying, or replying. It launches with Sri Lanka-focused intelligence and supports English, Sinhala, and Tamil.

## What is included

- Message, screenshot, URL, phone-number, and QR checks
- Explainable, multi-signal risk scoring with configurable backend weights
- Community reports, duplicate detection, moderation, and threat indicators
- Recent and saved checks with ownership controls
- "I Already Clicked" defensive guidance
- Credentials and optional Google authentication
- User privacy controls, export, deletion, masking, and expiring file links
- Admin overview, moderation, brands, threat intelligence, and risk settings
- Responsive desktop and mobile navigation

ScamCheck never treats community reports alone as authoritative proof and does not automatically open submitted links or QR destinations.

## Stack

Next.js 14 App Router, TypeScript, Tailwind CSS, Auth.js/NextAuth, Prisma, Zod, OpenAI (optional), and Supabase PostgreSQL.

## Local setup

1. Install Node.js 20 or newer and run:

   ```bash
   npm install
   ```

2. Copy `.env.example` to `.env`. Replace `NEXTAUTH_SECRET` with a long random value and add the Supabase transaction and session pooler URLs:

   ```env
   DATABASE_URL="postgresql://...:6543/postgres?pgbouncer=true"
   DIRECT_URL="postgresql://...:5432/postgres"
   ```

3. Import `supabase/scamcheck-schema.sql` once through the Supabase SQL Editor, then generate and seed:

   ```bash
   npm run prisma:generate
   npm run prisma:seed
   ```

4. Start the app:

   ```bash
   npm run dev
   ```

   Open `http://localhost:3000`.

## Demo accounts

The seed creates these development-only accounts:

| Role | Email | Password |
| --- | --- | --- |
| Admin | `admin@scamcheck.lk` | `Admin123!Secure` |
| Moderator | `moderator@scamcheck.lk` | `Admin123!Secure` |
| User | `user@scamcheck.lk` | `User123!Safe` |

Do not use seeded credentials in a public environment.

## Optional services

- Set `OPENAI_API_KEY` to enable backend AI-assisted message analysis. The deterministic risk engine remains available without it.
- Set `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` to enable Google login.
- Local development stores uploads in the non-public `private_uploads` directory and serves them through expiring signed routes. Configure private S3/R2 storage before a multi-instance production deployment.

## Supabase deployment

The primary Prisma schema targets Supabase PostgreSQL. Runtime traffic uses the transaction pooler in `DATABASE_URL`; schema and seed operations use the session connection in `DIRECT_URL`. Keep uploads private, use HTTPS, provide production OAuth callback URLs, and configure secrets through the hosting provider's secret manager.

## Verification

```bash
npm test
npx tsc --noEmit
npm run build
```

The test suite covers the sample parcel scam, phone normalization, sensitive-data masking, brand impersonation, multilingual detection, community intelligence, and external-AI fallback behavior.

## Important scope note

Risk results are decision support, not a guarantee of safety. Users should independently verify organizations through official websites, apps, or known phone numbers. The MVP does not intercept calls or SMS, integrate with banks, scan devices in real time, or provide offensive-security functions.

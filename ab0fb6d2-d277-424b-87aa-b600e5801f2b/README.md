# HomeKey Clean

House and commercial cleaning marketplace for Los Angeles and Orange County.
React 19 and TanStack Start, server rendered, deployed on Netlify with a
Supabase Postgres database.

## The model

HomeKey Clean is a **referral agency**, not a marketplace and not a cleaning
company. It never handles the client's payment.

- Cleaners publish their **own hourly rate**. The agency never sets it.
- Clients browse the directory, pick a cleaner, and send a request.
- The cleaner **accepts or declines** freely.
- On acceptance the client gets the cleaner's contact details and **pays them
  directly**. No escrow, no checkout, no cut.
- **Cleaners pay for access.** Two plans, both in `src/lib/hkc/domain.ts`:
  Listed ($0/month, $15 per accepted referral) and Pro ($79/month, no per
  referral fee, priority placement). Change the numbers in `PLANS`.

Both sides are shown the written non-employment disclosure before they commit.
The text lives in `DISCLOSURE_CLIENT` and `DISCLOSURE_CLEANER`.

### Before you go live

This structure is shaped around California's domestic referral agency rules
(Civil Code 1812.5095). House cleaning is excluded from the general AB 5
referral agency exemption in Labor Code 2777, so the domestic referral agency
path is the relevant one. Have a California employment lawyer review your
contracts, your disclosures, and your fee structure before taking real money.
Nothing here is legal advice.

## Deploying

1. **Get the database URL.** In Supabase open the `homekeyclean` project, then
   Project Settings, Database, Connection string. Choose the **Session pooler**
   URI and replace `[YOUR-PASSWORD]` with your database password.
2. **Create the site.** Push this folder to a GitHub repo, then in Netlify
   choose Add new site, Import an existing project, and pick that repo. Netlify
   reads `netlify.toml`, so the build command and publish directory are already
   set.
3. **Set the environment variable.** In Netlify go to Site configuration,
   Environment variables, and add `DATABASE_URL` with the string from step 1.
   Do this before the first deploy or the API routes will fail.
4. **Deploy.** Netlify runs `npm run build` and serves `dist/client` statically
   with `netlify/functions/server.mts` handling everything else.
5. **Custom domain.** Domain management, Add a domain, `homekeyclean.com`, then
   point your registrar at Netlify's nameservers.

## Local development

```bash
npm install
cp .env.example .env      # then fill in DATABASE_URL
npm run dev               # http://localhost:3000
```

## Database

The schema lives in `schema.sql` and is already applied to the Supabase
project. Re-running it is safe; every statement is `IF NOT EXISTS`.

A demo roster of six cleaners seeds itself on first request so the directory is
never empty: marisol@, danielle@, aurora@, kenji@, diego@, and
irena@homekeyclean.com, all at `demo1234`, each with a different rate and plan.
Delete those rows before you go live.

## What is not built yet

- **Billing the cleaners.** Referral fees and monthly plan charges are recorded
  against each cleaner (`fees_owed_cents`) but nothing is collected. Stripe
  Billing for the monthly plan plus metered invoicing for per referral fees is
  the natural fit.
- **Notifications.** Cleaners see new requests when they open their inbox. Email
  or SMS on a new request is the highest value thing to add next.
- **Request expiry.** Requests stay open until the cleaner answers. A scheduled
  function that nudges or auto expires stale requests would help both sides.

# AI Voice of Customer Analyzer

A portfolio-focused Next.js application for importing customer conversations, running a structured Gemini analysis, reviewing ranked insights, and creating local reports.

Conversation datasets and saved analysis results are stored in the browser with IndexedDB. CSV exports and printable reports are generated locally. Gemini is contacted only when a user explicitly runs analysis.

## Local development

Requirements: Node.js and npm.

1. Copy `.env.example` to `.env.local`.
2. Add a Gemini API key to `GEMINI_API_KEY` in `.env.local`.
3. Install dependencies with `npm install`.
4. Start the app with `npm run dev`.
5. Open [http://localhost:3000](http://localhost:3000).

Do not prefix the key with `NEXT_PUBLIC_`. The application reads `GEMINI_API_KEY` only inside the server-only Gemini module.

## Deploying to Vercel

Import the repository into Vercel and add `GEMINI_API_KEY` under Project Settings → Environment Variables for each environment that should support analysis. Do not commit `.env.local` or any real key.

The application includes an in-memory limit of five `/api/analyze` requests per client per minute. This reduces casual bursts on a warm function instance, but it is **not production-grade abuse prevention**: Vercel can run multiple isolated serverless instances, and counters reset on cold starts or deployments. A serious public service would need platform-level protection or a shared rate-limit store.

## Public demo privacy limitation

Imports, saved datasets, saved analysis results, dashboards, insights, reports, and exports remain in the visitor's browser. However, when a visitor selects **Run AI Analysis**, the chosen conversation records are sent to this application's Vercel server and then to Google Gemini for processing. Visitors should use fictional, anonymized, or otherwise non-sensitive data and should not submit confidential, regulated, or personally identifiable information to a public portfolio deployment.

The project has no authentication or shared application database. A public deployment should be presented as a portfolio demonstration, not as a protected production workspace.

## Available workflows

- Import CSV, TXT, pasted text, or fictional sample conversations.
- Save the current dataset and matching analysis locally with IndexedDB.
- Review Analysis Results, Dashboard metrics, Actionable Insights, and Reports.
- Download a spreadsheet-safe CSV report or print/save the report as PDF.
- Run structured analysis through the server-only Gemini integration.

## Commands

```bash
npm run dev
npm run lint
npm run build
```

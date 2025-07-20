# Debugging Guide for ASR-GoT Web Application

This document summarizes the overall architecture of the ASR-GoT framework and provides tips for debugging the web application running at [https://scientific-research.online/](https://scientific-research.online/).

## Architecture Overview

- **Frontend**: React 18 + TypeScript using Vite for build tooling. Global styles are defined in `src/index.css` and `src/App.tsx` wires up the main routes.
- **Backend**: Express server (`server/index.js`) with WebSocket support and Prisma for PostgreSQL access. Environment variables such as `PORT`, `CORS_ORIGIN` and rate limiting settings are read from `.env`.
- **Database**: Supabase project (`aogeenqytwrpjvrfwvjw`). Detailed schema and service descriptions are in `DATABASE_INTEGRATION.md`.
- **9‑Stage Pipeline**: Implementation of the mandatory research pipeline is described in `README.md` under **ASR-GoT Framework Architecture**.
- **Parameter System**: The complete list of parameters `P1.0`‑`P1.29` is defined in `src/config/asrGotParameters.ts` and explained in `CLAUDE.md`.

## Local Development

1. **Install dependencies**
   ```bash
   npm install --legacy-peer-deps
   ```
2. **Start the development server**
   ```bash
   npm run dev
   ```
   This serves the Vite application on port `8080` by default.
3. **Run the backend server**
   ```bash
   node server/index.js
   ```
   Ensure environment variables in `.env` or `.env.example` are configured.
4. **Linting and build**
   ```bash
   npm run lint
   npm run build
   ```

## Debugging Tips

- **Browser Console Tools**: The `IMMEDIATE_DEBUG_TOOLS.md` file contains copy‑paste snippets that can be executed in the browser console on the production site to capture state and error details.
- **API Errors**: Check the network tab for failed calls to `/api/sessions`, `/api/usage`, etc. The Express server logs errors to the console and returns a JSON error message.
- **WebSocket Events**: The backend uses Socket.IO. Use browser dev tools to inspect WebSocket frames and confirm events such as `session-created` or `graph-updated` are delivered.
- **Environment Variables**: Missing or incorrect values (e.g., `GEMINI_API_KEY`) may cause silent failures. Review `.env.example` for required variables.
- **Server Logs**: When running the backend locally, errors and connection details are printed to the terminal. These logs help track rate limiting or database connection issues.
- **Lint Errors**: `npm run lint` reports TypeScript issues. Many files still use the `any` type; fixing these warnings can prevent runtime errors.
- **Build Warnings**: During `npm run build`, Vite may warn about large chunks. This does not stop the build but indicates where code splitting might help.

## Further References

- **`CLAUDE.md`** – full project instructions and architecture
- **`DATABASE_INTEGRATION.md`** – database schema and services
- **`TREE_VISUALIZATION_README.md`** – details about the 3D botanical visualization
- **`IMMEDIATE_DEBUG_TOOLS.md`** – commands for immediate debugging in the browser

For persistent issues, capture the console output and network logs, then consult these documents to trace which stage or API call might be failing.

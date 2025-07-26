# GitHub Repository Secrets Setup Guide

## Required Secrets for GitHub Actions

To enable automated deployment to GitHub Pages, you need to configure the following secrets in your GitHub repository:

### 1. Navigate to Repository Settings
1. Go to https://github.com/SaptaDey/asr-nexus-explorer
2. Click on "Settings" tab
3. In the left sidebar, click on "Secrets and variables" → "Actions"

### 2. Add the Following Secrets

Click "New repository secret" for each:

#### VITE_SUPABASE_URL
- **Name**: `VITE_SUPABASE_URL`
- **Value**: `https://aogeenqytwrpjvrfwvjw.supabase.co`
- Click "Add secret"

#### VITE_SUPABASE_ANON_KEY
- **Name**: `VITE_SUPABASE_ANON_KEY`
- **Value**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFvZ2VlbnF5dHdycGp2cmZ3dmp3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjE3NTUyMDksImV4cCI6MjAzNzMzMTIwOX0.T_-2c37bIY8__ztVdYmPYQgpMhSprLhJMo9m6lxPCWE`
- Click "Add secret"

### 3. Verify Secrets
After adding both secrets, you should see them listed in the "Repository secrets" section.

## Security Notes
- These secrets are encrypted and can only be accessed by GitHub Actions workflows
- Never commit these values directly in your code
- The anon key is safe for client-side usage but should still be kept in secrets for CI/CD
- Service keys should NEVER be exposed client-side

## Using Secrets in GitHub Actions
The deployment workflow will access these secrets using:
```yaml
env:
  VITE_SUPABASE_URL: ${{ secrets.VITE_SUPABASE_URL }}
  VITE_SUPABASE_ANON_KEY: ${{ secrets.VITE_SUPABASE_ANON_KEY }}
```

## Additional Optional Secrets
If you need to add API keys for other services in the future:
- `VITE_PERPLEXITY_API_KEY` (if providing a default key)
- `VITE_GEMINI_API_KEY` (if providing a default key)

Note: For the ASR-GoT application, API keys are typically provided by users through the UI, so these are optional.
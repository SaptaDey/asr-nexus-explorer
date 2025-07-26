# Migration Recovery Plan

## Current State Backup
- **Repository**: https://github.com/SaptaDey/asr-nexus-explorer.git
- **Latest Commit**: 115c4a6 🧹 MAJOR CLEANUP: Consolidate Environment Files & Reorganize Documentation
- **Current Branch**: main
- **Production URL**: https://scientific-research.online/ (Lovable.dev)
- **Backup Date**: 2025-07-26

## Lovable.dev Dependencies Found
1. **lovable-tagger** (v1.1.8) in package.json
2. **componentTagger** import in vite.config.ts (line 4)
3. **componentTagger** plugin in vite.config.ts (line 29)

## Required Environment Variables
- `VITE_SUPABASE_URL`: Your Supabase project URL
- `VITE_SUPABASE_ANON_KEY`: Your Supabase anonymous key

## Recovery Steps (If Needed)
1. **Git Recovery**:
   ```bash
   git checkout 115c4a6  # Return to pre-migration state
   git checkout -b recovery-branch
   ```

2. **Restore Lovable Dependencies**:
   ```bash
   npm install lovable-tagger@1.1.8
   ```

3. **Restore Vite Config**:
   - Keep the componentTagger import and plugin

4. **Deploy to Lovable.dev**:
   - Use existing Lovable.dev deployment process
   - Verify production site is working

## Migration Rollback Checklist
- [ ] Restore git to pre-migration commit
- [ ] Reinstall lovable-tagger dependency
- [ ] Restore vite.config.ts with componentTagger
- [ ] Test locally with `npm run dev`
- [ ] Deploy to Lovable.dev
- [ ] Verify production functionality
- [ ] Monitor for errors

## Emergency Contacts
- GitHub Support: (if using Pro features)
- Supabase Support: (for database issues)
- Domain Registrar: (for DNS issues)

## Critical Notes
- Always test changes locally before pushing
- Keep Lovable.dev subscription active until migration is fully verified
- DNS changes can take 24-48 hours to propagate
- GitHub Actions minutes are limited even with Pro (3000/month)
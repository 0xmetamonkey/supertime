---
description: Deployment safeguard - ONLY USER deploys to production
---

# DEPLOYMENT RULE

## ⚠️ CRITICAL: AI NEVER DEPLOYS

**The AI assistant must NEVER:**
- Push to `master` or `main` branch
- Run `git push origin master`
- Run `git push origin main`
- Merge anything into production branches
- Trigger Vercel/Netlify deployments

## ✅ AI CAN:
- Make code changes locally
- Commit to feature branches (e.g., `staging`, `feature/*`)
- Push to non-production branches
- Prepare changes for review

## 🔐 Deployment Password
If the user explicitly asks to deploy and provides the password **"SHIP IT"**, then and ONLY then can the AI push to master.

Without this password, respond with:
> "Changes are ready locally. When you're ready to deploy, say 'SHIP IT' or push to master yourself."

## Testing Workflow
1. Make changes locally
2. Test on `npm run dev`
3. Commit to `staging` branch
4. User tests on staging URL
5. **USER** merges to master when satisfied

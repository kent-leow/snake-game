# Vercel Build Troubleshooting Guide

Since the local build is working but Vercel is still failing, here are the specific steps to resolve the issue:

## Immediate Actions

### 1. Clear Vercel Build Cache
In your Vercel dashboard:
- Go to your project settings
- Go to "Functions" tab  
- Click "Clear Build Cache"
- Redeploy

### 2. Check Node.js Version
Ensure Vercel uses the same Node.js version as local:

Add to `package.json`:
```json
{
  "engines": {
    "node": ">=18.0.0"
  }
}
```

### 3. Force Vercel to Use Specific Node Version
Create or update `.nvmrc`:
```
18
```

### 4. Add Explicit Build Configuration
Update `vercel.json`:
```json
{
  "version": 2,
  "name": "snake-game",
  "framework": "nextjs",
  "buildCommand": "npm run build",
  "installCommand": "npm install",
  "env": {
    "NODE_ENV": "production"
  },
  "functions": {
    "src/app/api/**/*.ts": {
      "maxDuration": 10
    }
  }
}
```

## Debugging Steps

### 1. Enable Verbose Logging
Add to package.json scripts:
```json
{
  "build:verbose": "next build --debug"
}
```

### 2. Check Vercel Build Logs
Look for these specific patterns in Vercel logs:
- `Module not found: Can't resolve '@/lib/game'`
- `Module not found: Can't resolve '@/components'`
- `Module not found: Can't resolve '@/hooks'`

### 3. Temporary Workaround
If issues persist, temporarily replace barrel imports with direct imports:

Instead of:
```typescript
import { PageLayout, HighScoreTable } from '@/components';
```

Use:
```typescript
import { PageLayout } from '@/components/ui/PageLayout';
import { HighScoreTable } from '@/components/HighScoreTable';
```

## Common Vercel Issues

### Case Sensitivity
Vercel is case-sensitive. Ensure all imports match exact file names.

### Missing Dependencies
Double-check all dependencies are in package.json (not just devDependencies).

### TypeScript Path Mapping
Sometimes Vercel has issues with complex path mappings. Our current setup should work.

## Last Resort Solutions

### 1. Simplify Barrel Exports
If issues persist, we can flatten the barrel exports to be more explicit.

### 2. Use Next.js Webpack Config
Add to `next.config.ts`:
```typescript
webpack: (config, { isServer }) => {
  // Add explicit resolution
  config.resolve.alias = {
    ...config.resolve.alias,
    '@/lib/game': path.resolve('./src/lib/game'),
    '@/components': path.resolve('./src/components'),
    '@/hooks': path.resolve('./src/hooks'),
  };
  return config;
}
```

## Verification Commands

Run these locally before each Vercel deployment:
```bash
npm run vercel-diagnostics
npm run verify-build
```

## Current Status

✅ Local build works perfectly
✅ All modules resolve correctly  
✅ Barrel exports are properly configured
✅ TypeScript compilation succeeds

The issue is likely environment-specific between local and Vercel infrastructure.
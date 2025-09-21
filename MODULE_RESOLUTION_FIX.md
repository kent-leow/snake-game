# Module Resolution Fix - December 2024

## Issue Summary
Vercel deployment was failing with module resolution errors:
- `Module not found: Can't resolve '@/lib/game'`
- `Module not found: Can't resolve '@/components'`  
- `Module not found: Can't resolve '@/hooks'`

## Root Cause
The main issue was a **barrel export dependency problem**:

1. The scores page imported from `@/components` (barrel export)
2. The components barrel export included `export * from './game'`
3. Game components import from `@/lib/game` 
4. This caused non-game pages to transitively depend on game modules
5. Vercel's module resolution was stricter than local builds

## Solution
Fixed by **splitting imports to be more specific**:

### Before (Problematic):
```typescript
// This pulls in ALL components, including game components
import { PageLayout, HighScoreTable } from '@/components';
```

### After (Fixed):
```typescript
// Import only what's needed from specific modules
import { PageLayout } from '@/components/ui';
import { HighScoreTable } from '@/components';
```

## Files Modified

### 1. `/src/app/scores/page.tsx`
- Split PageLayout import to come from `@/components/ui`
- Kept HighScoreTable from main components (safe, no game deps)

### 2. `/src/app/page.tsx` 
- Changed MainMenu import to `@/components/navigation`

### 3. `/src/components/HighScoreTable.tsx`
- Changed ScoreEntry import to relative path `./ScoreEntry`

### 4. `/src/components/index.ts`
- Commented out `export * from './game'` 
- Added clear documentation about game component dependencies

### 5. `/src/app/game/GamePage.tsx`
- Updated to import game components from `@/components/game`
- Split other imports by category (ui, mobile, etc.)

## Prevention Strategy

### 1. Import Guidelines
- **Game pages**: Import game components from `@/components/game`
- **Non-game pages**: Avoid main `@/components` barrel if possible
- **Specific imports**: Use `@/components/ui`, `@/components/navigation`, etc.

### 2. Barrel Export Rules
- Main `@/components` should only include universally safe exports
- Game components should be imported explicitly when needed
- Document dependencies in barrel files

### 3. Build Testing
- Local builds may pass while Vercel fails due to different resolution
- Added debug script for Vercel troubleshooting
- Test both `npm run build` and Vercel deployment

## Key Learnings

1. **Barrel exports can create unintended dependencies** - importing from a barrel pulls in everything transitively
2. **Vercel has stricter module resolution** than local Node.js builds 
3. **Tree-shaking doesn't always prevent resolution errors** - the modules still need to be resolvable
4. **Specific imports are safer** than broad barrel imports for complex dependency graphs

## Verification
- ✅ Local build: `npm run build` passes
- ✅ All imports properly typed  
- ✅ No circular dependencies
- ✅ Bundle size optimized (scores page smaller without game deps)

This fix should resolve the Vercel deployment issues while maintaining clean, maintainable imports.
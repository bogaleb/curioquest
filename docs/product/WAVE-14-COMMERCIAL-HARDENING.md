# Wave 14 — Commercial Hardening

## Goal

Prepare CurioQuest for serious family use by improving accessibility, reliability, privacy, performance, analytics, testing, and PWA readiness.

## Accessibility

Audit:

- semantic controls
- screen-reader labels
- keyboard access where relevant
- visible focus
- contrast
- reduced motion
- captions architecture
- non-audio alternatives
- readable typography
- child-sized touch targets

## Privacy and Safety

Verify:

- parent-owned accounts
- child subprofiles
- minimal child data
- no unnecessary child email
- no public child profiles
- no public messaging
- no unmoderated social features
- no unsafe external links in Child Mode
- correct RLS

Do not claim legal compliance without formal review.

## Error Handling

Children should rarely see technical errors.

Implement:

- error boundaries
- friendly retry states
- failed-media fallbacks
- offline detection
- safe loading states

Parents/admins may receive more useful technical context.

## Performance

Audit:

- bundle size
- images
- video
- client components
- rerenders
- duplicate requests
- database query patterns
- loading waterfalls

Use:

- lazy loading
- code splitting
- optimized Next.js images
- caching
- skeletons
- deferred content

## Analytics Architecture

Create a minimal internal event architecture for meaningful learning/product events such as:

- lesson_started
- lesson_completed
- activity_attempted
- skill_mastered
- hint_used
- game_started
- story_completed

Avoid invasive child tracking.

## PWA Readiness

Prepare for installable web use on:

- iPad
- Windows
- Android
- Chromebook

Do not implement fragile offline behavior prematurely.

## Testing

Protect critical flows:

- authentication
- onboarding
- profile selection
- age adaptation
- lesson launch
- progress saving
- game launch
- drawing launch
- fullscreen
- parent access
- RLS-sensitive behavior
- responsive navigation

## Completion Criteria

- production build clean
- critical flows tested
- no known severe accessibility/security regressions
- major performance issues addressed
- stable Vercel production/preview behavior

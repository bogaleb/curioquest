# Wave 02 — Welcome, Authentication, Onboarding, and Profile Selection

## Goal

Make the first experience feel like a premium children's learning product while keeping authentication simple and parent-controlled.

## Scope

Upgrade:

- welcome screen
- sign in
- sign up
- forgot/reset password
- email verification states
- authentication errors
- first-time onboarding
- add-child flow
- profile setup
- profile selection
- parent/child mode separation

## Welcome Screen

The first screen should communicate:

- CurioQuest is for children's learning
- the product is playful but credible
- parents are in control
- the child experience is engaging

Avoid:

- generic SaaS landing-page patterns
- excessive marketing copy
- clutter
- tiny forms

## Authentication

Provide polished states for:

- idle
- submitting
- success
- invalid credentials
- account already exists
- password reset requested
- email verification required
- network error

Children should not need email accounts.

## Parent Onboarding

Keep the flow concise.

Potential steps:

1. Parent account
2. Add child
3. Child first name/nickname
4. Age or date of birth
5. Grade
6. Interests
7. Optional learning goals
8. Session preference
9. Create profile
10. Enter CurioQuest

Do not collect unnecessary data.

## Age/Grade

Profile data must be stored cleanly so later waves can personalize:

- content
- difficulty
- language
- UI
- recommendations
- daily plan

## Profile Selection

Upgrade "Who's learning?"

Show:

- avatar
- name/nickname
- grade/age band if appropriate

Selection should be child-friendly and touch-friendly.

Parent-only controls should not be accidentally accessible.

## Supabase

Verify:

- parent owns child profile
- RLS prevents cross-account access
- profile creation/editing is secure
- no sensitive service-role key exposure

## Completion Criteria

- polished entry flow
- no broken auth states
- child profile creation persists correctly
- profile selection works across devices
- parent/child separation is clear
- production build passes

# Nova controlled tutor boundary

`lib/nova.ts` serves authored content only. The server supplies the active activity ID, skill ID, track, and hint level. Mismatched contexts are rejected. Levels provide a hint, strategy, and explanation.

Children cannot supply an open-ended prompt. No model API is called. Browser speech synthesis reads approved text and depends on device voices.

Future providers must preserve curriculum authority and server scoring, constrain responses to the activity and developmental level, reject personal-data requests and unrelated topics, and fall back to authored help. Representative interactions and failures must be reviewed before enabling generated replies. Parent consent, retention design, and provider evaluations remain unfinished.

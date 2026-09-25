# Discovery journal and learning library

This update refreshes the arrival experience and adds a connected library of original guided mini-lessons. The spatial map, existing reading progression, games, science investigations, Build Yard, Creative Studio, parent assignments and saved family progress are preserved. The supplied videos remain on hold.

## What children can do

The new home has six illustrated routes into discoveries, a primary action to start or resume the daily adventure, an offline noticing activity, and links to every existing learning destination. “My world map” retains the spatial navigation and family profile switching.

`/discover` offers 12 mini-lessons, each with three authored versions. The six existing age bands select an explorer, investigator or scientist version through the existing tier mapping. These are developmental approximations; they do not claim precise placement or full grade coverage.

| Area | Discoveries |
| --- | --- |
| Reading and language | A story in order; Word detective |
| Mathematics | Pack a picnic; A fair share |
| Science | The seed's secret; Catch a shadow |
| Reasoning and computing | The pattern band; Think like a robot |
| World knowledge and design | Make a little map; A tool for the job |
| Social understanding | Feelings have clues; Better together |

The lesson cycle is notice → try → take it with you. It includes a short explicit explanation, a worked example, a vocabulary definition, an activity, explanatory feedback, an oral discussion prompt, and an offline extension. Four interactive models let children count each object once and rearrange it, compare shadows, inspect plant growth stages, and explore a north-up map. The models are simplified representations; exploration is not scored.

Tasks include constructing quantities and ordering events, actions and number sequences, as well as selecting an answer. Mistakes retain the activity and offer a useful clue. Children can revisit the example or leave without a penalty. Search, topic filters, read-aloud prose and large controls support access. Phoneme generation is not introduced.

## Research and content provenance

These sources informed the design. They do not establish that CurioQuest itself improves learning, and this release has not undergone educator review or an efficacy study.

- [WWC: Teaching Math to Young Children](https://ies.ed.gov/ncee/wwc/PracticeGuide/18): developmental progressions, concrete quantities, everyday applications and progress monitoring.
- [WWC: Foundational Skills to Support Reading for Understanding](https://ies.ed.gov/ncee/WWC/PracticeGuide/21/Published): language and vocabulary alongside explicit decoding and connected reading. New story activities complement the existing phonics path; they do not replace it.
- [WWC: Organizing Instruction and Study](https://ies.ed.gov/ncee/wwc/PracticeGuide/1): examples connected to practice, explanations and revisiting learning. Much of the guide concerns older learners; preschool adaptations here are design choices. This release encourages revisiting but does not add an automatic spaced-review scheduler.
- [NGSS: K–2 Engineering Design](https://www.nextgenscience.org/pe/k-2-ets1-1-engineering-design): identify a problem, observe, design and test. Standards alignment is not research evidence of effectiveness.
- [NGSS: Light and materials](https://www.nextgenscience.org/dci-arrangement/1-ps4-waves-and-their-applications-technologies-information-transfer): compare transmission and blocking of light.
- [NGSS: Plant growth](https://www.nextgenscience.org/search-standards?keys=plants): investigate water and light. The lesson distinguishes initial germination from a growing green plant's needs.
- [Harvard: Executive Function Activities Guide](https://developingchild.harvard.edu/resources/handouts-tools/activities-guide-enhancing-and-practicing-executive-function-skills/): shared games and practice with rules, remembering and taking turns. Choosing a considerate response is not evidence of a child's real-world behaviour or emotional wellbeing.

The typed source registry is in `lib/discover/sources.ts`; each lesson declares its source IDs. Authored content lives in a server-only module. Increasing the bank requires an explicit explanation, valid skill mapping, task, feedback, oral prompt, offline extension and source references for every version. Authored-bank version is bumped to `code-2`.

## Progress contract

The existing authenticated family context, profile ownership reads, schedule checks, optimistic revisions and atomic event/profile commit are reused. GET returns the age-resolved content without answer keys. POST validates bounded input and judges the answer on the server.

Every attempt is guided practice (`support: model`, `phase: guided`) because an example was available. No independent mastery, stars or rewards are granted merely for completing these lessons. Verbal explanations and offline activities are invitations, not automatically assessed outcomes. Progress is tier-specific and shown as “practised”, never “mastered”.

A unique attempt ID survives a failed request. Retrying a committed attempt returns its verdict without a second write. Concurrent profile changes return a retryable conflict. Existing history reads are capped at 20,000 events; long-term practice summaries should eventually use an indexed aggregate rather than a full-history scan.

## Verification and limits

`tests/discover.test.mjs` verifies content, skill/source links, all answer variants, private answer keys, invalid submissions, tier-specific progress, and the production route with isolated authentication/repository adapters. `scripts/test-discover-ui.mjs` exercises the real components inside KidShell against a development-only judging API, including all lessons across four band/viewport combinations, filtering, empty results, pause, retry identity and keyboard focus restoration. The preview endpoint returns 404 in production.

No real family records are written by verification. Database persistence is checked at the route contract using isolated adapters and the existing transaction implementation, not through a live authenticated family session. A physical device, listening-quality review, screen reader session, and educator/child evaluation remain necessary. This is a substantial new learning slice and visual entry experience, not a claim that the entire Pre-K–Grade 3 curriculum has been rebuilt or validated.

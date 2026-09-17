# Parent access and private family ownership

The deployed Site must remain owner-private. Initial Parent Corner setup is an explicit action by that signed-in owner. It stores the platform-authenticated identity alongside the parent lock; subsequent family reads and writes reject a different identity. Existing explorer records remain in place. There is no public registration or multi-family membership model.

Local loopback development uses `local-family` (including the starter's `local_seedy` mock identity). Hosted requests require the dispatch-provided authenticated-user header. Do not expose the Worker through a second origin that allows callers to forge those headers.

The PIN is a child/parent boundary inside an already authenticated private workspace, not an internet account password. It is stored as a salted PBKDF2-SHA256 hash with 100,000 iterations, using the runtime's [Web Crypto API](https://developers.cloudflare.com/workers/runtime-apis/web-crypto/). Online checks consume an atomic database attempt before verification, allowing five attempts per 15-minute window.

Successful unlock issues a random 256-bit token in an HttpOnly, SameSite=Strict cookie, with Secure on HTTPS. Only its SHA-256 digest is stored. Sessions expire after 15 minutes and bind to the authenticated identity. A new unlock replaces previous sessions for that identity. PIN rotation checks the stored salt before creating a session to reject a concurrent outdated unlock.

Initial setup and recovery return a random recovery code once. Its hash is stored. Recovery replaces the PIN and recovery code and invalidates existing parent sessions. Keep the code outside the child's device. PINs, tokens, and recovery codes must never appear in logs or family exports.

Protected operations: profile creation/editing, comfort/pause settings, real-world mission confirmation, and family data export. Child learning remains available without an unlocked parent session. Paused profiles cannot submit learning actions; their saved quest remains intact.

Remaining release work: independent security review, public/multi-family account lifecycle if desired, deletion/retention policy, and platform-level recovery if the owner loses both PIN and recovery code. A six-digit PIN does not protect against offline attacks after a database compromise; the platform access policy remains essential.

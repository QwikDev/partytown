---
'@qwik.dev/partytown': patch
---

✨ GTM's Tag Assistant preview now connects to pages running GTM inside Partytown: scripts the worker can't read (no CORS headers, like the debug bootstrap) fall back to the main thread, the container's debug queue is bridged during `gtm_debug` sessions, and `window.opener` / message `event.source` work from the worker

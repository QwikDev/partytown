---
'@qwik.dev/partytown': patch
---

perf: in atomics mode, main thread responses go through the shared buffer as utf-8 bytes instead of one 4-byte slot per character, roughly 3–20x faster and up to 4x less memory, and a response larger than the buffer's 1GB limit now returns an error instead of a cut, unparsable response

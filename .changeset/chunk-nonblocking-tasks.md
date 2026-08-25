---
'@qwik.dev/partytown': patch
---

🐞🩹 large non-blocking DOM operation batches now yield the main thread every ~40ms, keeping tasks under the 50ms long-task threshold and reducing reported TBT

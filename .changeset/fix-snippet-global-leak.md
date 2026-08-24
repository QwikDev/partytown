---
'@qwik.dev/partytown': patch
---

🐞🩹 wrap the snippet in an IIFE so top-level helpers no longer leak `t`, `e`, `n` into the page's global scope and break other classic scripts

---
'@qwik.dev/partytown': patch
---

🐞🩹 allocate the atomics SharedArrayBuffer small and grow it on demand instead of eagerly reserving 1GB, which newer Chrome versions can refuse

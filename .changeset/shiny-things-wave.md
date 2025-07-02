---
"@qwik.dev/partytown": patch
---

FIX: Add dummy setAttribute method to HTMLImageElement

Added a placeholder setAttribute method to HTMLImageElement class to prevent errors when third-party scripts attempt to set attributes on Image instances. This method currently does nothing but prevents runtime errors from occurring.

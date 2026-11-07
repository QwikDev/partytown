---
'@qwik.dev/partytown': patch
---

fix: don't read `window.fence` while reading the main window's members — in Chrome, reading it triggers the "FencedFrame" deprecation that Lighthouse reports under "Uses deprecated APIs", which skipping `HTMLFencedFrameElement` in #788 did not cover

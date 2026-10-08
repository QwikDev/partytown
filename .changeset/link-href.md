---
'@qwik.dev/partytown': patch
---

fix: `href` of `<link>` and `<base>` elements is read and set on the main thread again, so a stylesheet a worker script adds with `link.href = url` loads; the no-op `href` every node has (for scripts walking up the tree) hid it.

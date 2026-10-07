---
'@qwik.dev/partytown': patch
---

fix: a worker `message` listener can reply through the `MessagePort`s sent with the message (`event.ports[0].postMessage`), e.g. an ad library answering its creative's channel.
